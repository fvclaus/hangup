"use client";

import { Title } from "@/components/ui/title";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { LOGOUT_URL } from "@hangup/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Settings() {
  const [isConfirmDialogVisible, setShowConfirmDialog] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  const handleDeleteData = async () => {
    setDeleting(true);

    const response = await fetch(`/api/user`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (response.ok) {
      setDeleteError(undefined);
      window.location.href = LOGOUT_URL;
    } else {
      setDeleteError(await response.text());
    }
  };

  const toggleDialogVisibility = () => {
    setDeleteError(undefined);
    setShowConfirmDialog(!isConfirmDialogVisible);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Title title="Settings" />
      <div className="w-full bg-blue-50 py-16 text-gray-600 flex flex-col items-center">
        <div className="px-4 max-w-screen-lg w-full flex flex-col bg-white rounded-2xl shadow-xl p-8">
          <section className="w-full ">
            <div className=" pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Management
              </h2>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-700 mb-1">
                    Permanently Delete All Data
                  </p>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone. All your data will be
                    permanently deleted.
                  </p>
                </div>
                <button
                  onClick={toggleDialogVisibility}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  aria-haspopup={isConfirmDialogVisible}
                  aria-controls="delete-user-dialog"
                  id="delete-user-dialog-button"
                >
                  <Trash2 size={18} />
                  Delete Data
                </button>
              </div>
              {isConfirmDialogVisible && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
                  aria-labelledby="delete-user-dialog-button"
                  role="dialog"
                  id="delete-user-dialog"
                >
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Confirm Deletion
                    </h3>
                    {deleteError && (
                      <Alert>
                        <AlertTitle>Could not delete your account</AlertTitle>
                        <AlertDescription>{deleteError}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete all your data? This action
                      cannot be undone.
                    </p>
                    <div className="flex justify-end gap-4">
                      <button
                        disabled={isDeleting}
                        onClick={toggleDialogVisibility}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isDeleting}
                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
                        onClick={handleDeleteData}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDeleting ? (
                          <Loader2
                            role="status"
                            aria-label="loading"
                            className="animate-spin"
                            size={18}
                          />
                        ) : null}
                        Delete Everything
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
