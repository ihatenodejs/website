"use client";

import { useCallback, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

type RevealEmailResponse = {
  email: string;
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function Contact() {
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccess = useCallback(async (token: string) => {
    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/contact/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Verification request failed.");
      }

      const data = (await response.json()) as RevealEmailResponse;

      if (!data.email) {
        throw new Error("Email is unavailable.");
      }

      setRevealedEmail(data.email);
    } catch {
      setErrorMessage("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleExpire = useCallback(() => {
    if (!revealedEmail) {
      setErrorMessage("Verification expired. Please complete it again.");
    }
  }, [revealedEmail]);

  return (
    <section
      id="contact"
      className="border-t border-gray-200 px-8 py-20 max-w-3xl mx-auto w-full"
    >
      <h2 className="text-xl font-bold mb-4">Contact</h2>
      <p className="text-gray-600 text-sm leading-7 mb-6">
        Feel free to reach out! I check my email frequently.
      </p>
      <div className="flex flex-col gap-2 text-sm">
        {revealedEmail ? (
          <div className="flex items-center gap-2">
            <span className="font-bold">Email:</span>
            <a
              href={`mailto:${revealedEmail}`}
              className="underline text-blue-600 hover:text-blue-400 transition-colors"
            >
              {revealedEmail}
            </a>
          </div>
        ) : (
          <>
            {!turnstileSiteKey ? (
              <p className="text-red-600">
                Contact verification is not configured yet.
              </p>
            ) : (
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={handleSuccess}
                onExpire={handleExpire}
                options={{
                  action: "contact_reveal",
                  theme: "light",
                }}
              />
            )}
            {isVerifying ? (
              <p className="text-gray-500">Verifying challenge...</p>
            ) : null}
            {errorMessage ? (
              <p className="text-red-600">{errorMessage}</p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
