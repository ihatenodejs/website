import { NextResponse } from "next/server";

const turnstileVerifyEndpoint =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifySuccess = {
  success: true;
};

type TurnstileVerifyFailure = {
  success: false;
  "error-codes"?: string[];
};

type TurnstileVerifyResponse = TurnstileVerifySuccess | TurnstileVerifyFailure;

type RevealRequest = {
  token?: string;
};

export async function POST(request: Request) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!secretKey || !contactEmail) {
    return NextResponse.json(
      { error: "Server configuration is incomplete." },
      { status: 500 },
    );
  }

  let body: RevealRequest;

  try {
    body = (await request.json()) as RevealRequest;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const token = body.token?.trim();

  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const remoteIpHeader = request.headers.get("x-forwarded-for");
  const remoteip = remoteIpHeader ? remoteIpHeader.split(",")[0].trim() : "";

  const payload = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (remoteip) {
    payload.set("remoteip", remoteip);
  }

  const verifyResponse = await fetch(turnstileVerifyEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
    cache: "no-store",
  });

  if (!verifyResponse.ok) {
    return NextResponse.json(
      { error: "Verification unavailable." },
      { status: 502 },
    );
  }

  const result = (await verifyResponse.json()) as TurnstileVerifyResponse;

  if (!result.success) {
    return NextResponse.json(
      { error: "Verification failed." },
      { status: 403 },
    );
  }

  return NextResponse.json({ email: contactEmail }, { status: 200 });
}
