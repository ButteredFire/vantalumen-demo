import React from 'react';

export interface SurfaceToast {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    description?: string;
}

interface SurfaceToastSystemProps {
    toasts: SurfaceToast[];
    onDismiss: (id: number) => void;
}

export const SurfaceToastSystem: React.FC<SurfaceToastSystemProps> = ({
    toasts,
    onDismiss,
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className="surface-toast-container" aria-live="polite">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`surface-toast-item toast-${toast.type} glass-panel`}
                    onClick={() => onDismiss(toast.id)}
                    role="alert"
                >
                    <div className="toast-badge-icon">
                        {toast.type === 'error' && '⚠'}
                        {toast.type === 'warning' && '⬡'}
                        {toast.type === 'success' && '✔'}
                        {toast.type === 'info' && 'ℹ'}
                    </div>
                    <div className="toast-content-block">
                        <strong className="toast-item-title">{toast.title}</strong>
                        {toast.description && (
                            <p className="toast-item-desc">{toast.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
