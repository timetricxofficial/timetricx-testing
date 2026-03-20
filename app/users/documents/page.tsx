'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import Loading from '../../../components/ui/Loading';
import Dialog from '../../../components/ui/Dialog';

const DOCS = [
  {
    label: 'Aadhar Card',
    key: 'aadhar',
    accept: '.pdf',
    description: 'PDF only'
  },
  {
    label: 'College ID',
    key: 'collegeId',
    accept: 'image/*',
    description: 'Images only (JPG, PNG)',
    allowNotAvailable: true,
    note: "Please rename your Identity Card file to 'collegeid' (e.g., collegeid.jpg) before uploading."
  },
  {
    label: 'Signed Offer Letter',
    key: 'signedOfferLetter',
    accept: '.pdf',
    description: 'Signed PDF only',
    note: "Please upload the Offer Letter after signing it. System will verify for signature."
  },
  {
    label: 'NOC',
    key: 'noc',
    accept: '.pdf,image/*',
    description: 'PDF, JPG, PNG',
    note: "When you receive your offer letter, you will update NOC upload which you will get from college."
  },
  {
    label: '10th Marksheet',
    key: 'marksheet10',
    accept: '.pdf',
    description: 'PDF only (Max 2MB)'
  },
  {
    label: '12th Marksheet',
    key: 'marksheet12',
    accept: '.pdf',
    description: 'PDF only (Max 2MB)'
  },
];

/* =========================
   CLIENT-SIDE UPLOAD (for large files - bypasses Vercel 4.5MB limit)
   Get signature from server → Upload to Cloudinary → Save URL to MongoDB
========================= */
const uploadToCloudinaryDirect = async (
  file: File,
  email: string,
  docType: string,
  label: string,
  oldUrl: string | null
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Step 1: Get signed upload params from server
    const sigRes = await fetch('/api/users/documents/get-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, docType }),
    });

    const sigData = await sigRes.json();
    
    if (!sigData.success) {
      console.error('[SIGNATURE ERROR]', sigData);
      return { success: false, error: sigData.message || 'Failed to get upload signature' };
    }

    const { signature, timestamp, folder, publicId, apiKey, cloudName } = sigData;

    // Step 2: Upload directly to Cloudinary with signature
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', publicId.split('/').pop() || '');
    formData.append('resource_type', 'auto');

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      console.error('[CLOUDINARY UPLOAD ERROR]', errorData);
      return { success: false, error: errorData.error?.message || 'Cloudinary upload failed' };
    }

    const uploadData = await uploadRes.json();
    const fileUrl = uploadData.secure_url;

    // Step 3: Save URL to MongoDB via API
    const saveRes = await fetch('/api/users/documents/save-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, docType, url: fileUrl }),
    });

    const saveData = await saveRes.json();

    if (!saveData.success) {
      console.error('[SAVE URL ERROR]', saveData);
      return { success: false, error: saveData.message || 'Failed to save document' };
    }

    return { success: true, url: fileUrl };
  } catch (err: any) {
    console.error('[DIRECT UPLOAD ERROR]', err);
    return { success: false, error: err.message || 'Upload failed' };
  }
};
const getUserFromCookies = () => {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('user='));

  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch {
    return null;
  }
};

const getViewableUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('.pdf')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}view=true`;
  }
  return url;
};

/* =========================
   COMPONENT
========================= */
export default function InternDocuments() {
  const { theme } = useTheme();
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [docsData, setDocsData] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Preview modal state
  const [preview, setPreview] = useState<{ url: string; label: string; isPdf: boolean } | null>(null);

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error' | 'success' | 'warning';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info', onConfirm?: () => void) => {
    setDialog({ isOpen: true, title, message, type, onConfirm });
  };

  /* AUTH */
  useEffect(() => {
    const token = Cookies.get('token');
    const userFromCookies = getUserFromCookies();

    if (!token || !userFromCookies?.email) {
      router.replace('/landing/auth/login');
      return;
    }

    setUser(userFromCookies);
    setAuthLoading(false);
  }, [router]);

  const email = user?.email;

  // Check if document type should use client-side upload (for large files)
  const isClientSideUpload = (docType: string): boolean => {
    return docType === 'signedOfferLetter' || docType === 'noc';
  };

  /* FETCH DOCS */
  useEffect(() => {
    if (!email) return;

    const fetchDocs = async () => {
      try {
        const res = await fetch(
          `/api/users/documents/get-intern-documents?email=${email}`,
          { cache: 'no-store' } // 🚀 Prevent caching issues
        );
        const data = await res.json();

        if (data.success) {
          setDocsData(data.documents || {});
        }
      } catch (err) {
        console.error('Failed to load documents', err);
      }
    };

    fetchDocs();
  }, [email]);

  /* UPLOAD */
  const uploadFile = async (file: File, docType: string, label: string) => {
    if (!email) return;

    // ----- CLIENT-SIDE UPLOAD for signedOfferLetter & noc (large files) -----
    if (isClientSideUpload(docType)) {
      const oldUrl = docsData[docType] || null;
      
      // Validation
      const isPdfFile = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (docType === 'signedOfferLetter' && !isPdfFile(file)) {
        showAlert('Invalid Format', 'Offer Letter must be in PDF format.', 'error');
        return;
      }
      if (docType === 'noc' && !isPdfFile(file) && !file.type.startsWith('image/')) {
        showAlert('Invalid Format', 'NOC must be PDF or Image format.', 'error');
        return;
      }

      setLoading(docType);
      const result = await uploadToCloudinaryDirect(file, email, docType, label, oldUrl);
      
      if (result.success && result.url) {
        setDocsData(prev => ({
          ...prev,
          [docType]: result.url,
        }));
        showAlert('Success', `${label} uploaded successfully!`, 'success');
      } else {
        showAlert('Upload Failed', result.error || 'Something went wrong during upload.', 'error');
      }
      setLoading(null);
      return;
    }

    // ----- SERVER-SIDE UPLOAD for other documents (existing logic) -----
    // ----- ENFORCE FILE TYPES -----
    if (docType === 'aadhar' && file.type !== 'application/pdf') {
      showAlert('Invalid Format', 'Aadhar Card must be in PDF format.', 'error');
      return;
    }
    if (docType === 'collegeId' && !file.type.startsWith('image/')) {
      showAlert('Invalid Format', 'College ID must be an image (JPG/PNG).', 'error');
      return;
    }
    const isPdfFile = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if ((docType === 'offerLetter' || docType === 'signedOfferLetter') && !isPdfFile(file)) {
      showAlert('Invalid Format', 'Offer Letter must be in PDF format.', 'error');
      return;
    }

    // ----- ENFORCE 10th/12th MARKSHEET VALIDATION -----
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if ((docType === 'marksheet10' || docType === 'marksheet12')) {
      if (file.size > MAX_SIZE) {
        showAlert('File Too Large', `${label} must be less than 2MB.`, 'error');
        return;
      }
      if (!isPdfFile(file)) {
        showAlert('Invalid Format', `${label} must be in PDF format.`, 'error');
        return;
      }
    }

    // 🔎 CLIENT-SIDE COLLEGE ID VERIFICATION
    if (docType === 'collegeId') {
      const fileName = file.name.toLowerCase();
      const idKeywords = ['college', 'id', 'identity', 'student', 'card', 'university', 'uni', 'idcard', 'profile', 'ident', 'roll'];
      const looksLikeId = idKeywords.some(k => fileName.includes(k));

      if (!looksLikeId) {
        showAlert(
          'Verification Alert',
          `The file "${file.name}" doesn't look like a standard Identity Card filename. Are you sure this is your College ID Card?`,
          'warning',
          () => proceedWithUpload(file, docType, label)
        );
        return;
      }
    }



    // 🔎 CLIENT-SIDE AADHAAR VERIFICATION (Avoids Server Load)
    if (docType === 'aadhar') {
      try {
        // Read PDF locally in the browser
        const reader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });

        // Search for Aadhaar-specific keywords in binary/text
        const decoder = new TextDecoder();
        const rawText = decoder.decode(arrayBuffer).toLowerCase();

        const aadharKeywords = [
          'aadhaar',
          'enrollment',
          'govt of india',
          'unique identification',
          'government of india',
          'bharat sarkar',
          'mera aadhaar'
        ];

        const isAadhar = aadharKeywords.some(keyword => rawText.includes(keyword));

        if (!isAadhar) {
          // Strictly block upload if it doesn't look like Aadhaar
          showAlert('Invalid Document', "This PDF doesn't look like a standard Aadhaar Card. Please upload a valid Aadhaar PDF document.", 'error');
          return; // 🛑 BLOCK UPLOAD
        }
      } catch (err) {
        console.warn("Local PDF read failed:", err);
      }
    }

    proceedWithUpload(file, docType, label);
  };

  const proceedWithUpload = async (file: File, docType: string, label: string) => {
    setLoading(docType);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('email', email);

    console.log(`[FRONTEND] Uploading: docType=${docType}, email=${email}, file=${file.name}`);

    try {
      const res = await fetch('/api/users/documents/intern-documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log(`[FRONTEND] Response:`, data);

      if (data.success && data.url) {
        // Force update local state immediately
        setDocsData(prev => ({
          ...prev,
          [docType]: data.url,
        }));
        showAlert('Success', `${label} uploaded successfully!`, 'success');
      } else {
        console.error(`[FRONTEND] Upload failed:`, data);
        showAlert('Upload Failed', data.message || 'Something went wrong during upload.', 'error');
      }
    } catch (err) {
      console.error('[FRONTEND] Upload error:', err);
      showAlert('Error', 'Server connection failed. Please try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  /* REMOVE */
  const deleteDocument = async (docType: string) => {
    if (!email) return;

    setLoading(docType);
    try {
      const res = await fetch('/api/users/documents/remove-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, docType }),
      });

      const data = await res.json();

      if (data.success) {
        setDocsData(prev => {
          const newData = { ...prev };
          delete newData[docType];
          return newData;
        });
        showAlert('Deleted', 'Document removed successfully.', 'success');
      } else {
        showAlert('Delete Failed', data.message || 'Could not remove document.', 'error');
      }
    } catch (err) {
      console.error('Remove failed', err);
      showAlert('Error', 'Server connection failed while deleting.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const setAsNotAvailable = async (docType: string) => {
    if (!email) return;
    setLoading(docType);

    try {
      // We'll reuse the same endpoint but handle text if needed, 
      // or if we can't change backend easily, we can just send a dummy file or empty string.
      // Better approach: use a separate small API or allow null in a new endpoint.
      // Since I have backend access, I'll update the backend to allow this.
      const res = await fetch('/api/users/documents/intern-documents/mark-na', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, docType, value: 'NOT_AVAILABLE' }),
      });

      const data = await res.json();
      if (data.success) {
        setDocsData(prev => ({ ...prev, [docType]: 'NOT_AVAILABLE' }));
      }
    } catch (err) {
      console.error('Failed to mark as N/A', err);
    } finally {
      setLoading(null);
    }
  };

  if (authLoading) return <Loading fullPage />

  return (
    <div
      className={`min-h-screen p-6 ${theme === 'dark'
        ? 'bg-black'
        : 'bg-white'
        }`}
    >
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
          >
            Documents
          </h1>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Upload and view your important documents
          </p>
        </motion.div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOCS.map((doc, i) => {
            let uploadedUrl = docsData[doc.key];

            // Fallback for Signed Offer Letter: check old key if new one is empty
            if (doc.key === 'signedOfferLetter' && !uploadedUrl && docsData['offerLetter']) {
              uploadedUrl = docsData['offerLetter'];
            }

            return (
              <motion.div
                key={doc.key}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative rounded-2xl p-6 overflow-hidden shadow-xl cursor-pointer
                ${theme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white border'
                  }`}
              >
                {/* GLOW */}
                <div className="pointer-events-none absolute -inset-6 opacity-0 hover:opacity-100 transition
                  bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.35),transparent_60%)] blur-2xl" />

                {/* TITLE */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${theme === 'dark'
                        ? 'text-white'
                        : 'text-gray-900'
                        }`}
                    >
                      {doc.label}
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {doc.description}
                    </p>
                  </div>
                </div>

                {/* NOTE FOR NOC */}
                {doc.note && (
                  <div className={`mb-4 p-2 rounded-lg text-[10px] leading-tight ${theme === 'dark' ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-50 text-blue-700'} border border-blue-200/50`}>
                    {doc.note}
                  </div>
                )}

                {/* FILE INPUT */}
                <input
                  type="file"
                  accept={doc.accept}
                  disabled={loading === doc.key}
                  onChange={e =>
                    e.target.files &&
                    uploadFile(e.target.files[0], doc.key, doc.label)
                  }
                  className="hidden"
                  id={`file-${doc.key}`}
                />

                {/* UPLOAD AREA */}
                <label
                  htmlFor={`file-${doc.key}`}
                  className={`relative z-10 flex flex-col items-center justify-center
                  border-2 border-dashed rounded-xl p-4 transition cursor-pointer
                  ${loading === doc.key
                      ? 'opacity-50'
                      : 'hover:border-blue-500'
                    }`}
                >
                  {loading === doc.key ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Loading size="small" />
                      <span className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Uploading...</span>
                    </div>
                  ) : uploadedUrl === 'NOT_AVAILABLE' ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className={`text-sm mt-2 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Not Available
                      </span>
                    </>
                  ) : uploadedUrl ? (
                    <>
                      {/* Detect PDF based on extension OR doc key */}
                      {(uploadedUrl.toLowerCase().includes('.pdf') || ['aadhar', 'signedOfferLetter', 'noc', 'offerLetter'].includes(doc.key)) ? (
                        <>
                          <div className="relative group">
                            <FileText className="w-12 h-12 text-red-500 transition-transform group-hover:scale-110" />
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow-sm">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <span className={`text-sm mt-3 font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                            {doc.label} Submitted
                          </span>
                          <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Properly Verified & Saved
                          </p>
                        </>
                      ) : (
                        <img
                          src={uploadedUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <span className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Click to replace
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload</span>
                    </>
                  )}
                </label>

                {/* NOT AVAILABLE OPTION */}
                {doc.allowNotAvailable && !uploadedUrl && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setAsNotAvailable(doc.key);
                    }}
                    className={`mt-2 w-full py-1 text-[10px] rounded border border-dashed transition
                     ${theme === 'dark' ? 'border-gray-700 text-gray-500 hover:text-gray-300' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                  >
                    I don't have this document
                  </button>
                )}

                {/* VIEW */}
                <div className="relative mt-4">
                  {uploadedUrl && uploadedUrl !== 'NOT_AVAILABLE' ? (
                    <button
                      onClick={() => {
                        const isPdf = uploadedUrl.toLowerCase().includes('.pdf') || ['aadhar', 'signedOfferLetter', 'noc', 'offerLetter', 'resume', 'marksheet10', 'marksheet12'].includes(doc.key);
                        setPreview({ url: uploadedUrl, label: doc.label, isPdf });
                      }}
                      className={`flex items-center gap-2 text-sm hover:underline cursor-pointer ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}
                    >
                      <Eye className="w-4 h-4" />
                      View document
                    </button>
                  ) : (
                    <p className={`text-xs flex items-center gap-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      <AlertCircle className="w-3 h-3" />
                      {uploadedUrl === 'NOT_AVAILABLE' ? 'Marked as Not Available' : 'Not uploaded yet'}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* DIALOG POPUP */}
        <Dialog
          isOpen={dialog.isOpen}
          onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          onConfirm={dialog.onConfirm}
          confirmLabel={dialog.onConfirm ? "Yes, OK" : "OK"}
        />

        {/* DOCUMENT PREVIEW MODAL */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setPreview(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className={`relative w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{preview.label}</h3>
                  </div>
                  <button
                    onClick={() => setPreview(null)}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden">
                  {preview.isPdf ? (
                    <iframe
                      src={getViewableUrl(preview.url)}
                      className="w-full h-full border-0"
                      title={preview.label}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                      <img
                        src={preview.url}
                        alt={preview.label}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INFO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`mt-10 p-4 rounded-xl flex gap-3 items-start
          ${theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-blue-50 border border-blue-200'
            }`}
        >
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            PDFs open in browser view mode. Re-uploading a document will replace
            the existing one and automatically delete the old version from storage.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
