"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
	children: ReactNode;
	showLoader?: boolean;
}

export const AuthProvider = ({ children, showLoader = true }: AuthProviderProps) => {
	const initialize = useAuthStore((state) => state.initialize);
	const isLoading = useAuthStore((state) => state.isLoading);
	const initRef = useRef(false);

	useEffect(() => {
		if (initRef.current) {
			return;
		}

		initRef.current = true;
		void initialize();
	}, [initialize]);

	if (showLoader && isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
				<div className="text-center space-y-4">
					<div className="w-12 h-12 mx-auto border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
					<p className="text-lg font-medium">Preparing your learning experience...</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};

export default AuthProvider;
