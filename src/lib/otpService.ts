import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";

/**
 * Generates a 6-digit passcode, saves it to Firestore named `otps`
 * (document ID = student's email, 10-minute expiration),
 * and triggers EmailJS with template variables: email, passcode, time.
 */
export async function sendOTP(email: string): Promise<string> {
  const emailNorm = email.toLowerCase().trim();
  
  // 1. Generate 6-digit passcode
  const passcode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 2. Calculate expiration time (10 minutes from now)
  const tenMinutes = 10 * 60 * 1000;
  const expiresAt = new Date(Date.now() + tenMinutes);
  
  // 3. Save to Firestore collection 'otps' using email as the document ID
  const otpDocRef = doc(db, "otps", emailNorm);
  await setDoc(otpDocRef, {
    email: emailNorm,
    passcode: passcode,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  });
  
  // 4. Trigger EmailJS
  const serviceId = "service_0kzvnoa";
  const templateId = "template_uhhfktn";
  const publicKey = "f30jwoGVbZf-k8t86";
  
  const templateParams = {
    email: emailNorm,
    passcode: passcode,
    time: "10 minutes"
  };

  try {
    // Try sending with direct arguments
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
  } catch (err) {
    console.warn("EmailJS direct send fallback to options object:", err);
    // Alternatively send with options object as required by newer version of sdk
    await emailjs.send(serviceId, templateId, templateParams, { publicKey });
  }
  
  return passcode;
}

/**
 * Verifies if the entered 6-digit passcode is correct and not expired
 */
export async function verifyOTP(email: string, otpInput: string): Promise<boolean> {
  const emailNorm = email.toLowerCase().trim();
  const rawOtpInput = otpInput.trim();
  
  const otpDocRef = doc(db, "otps", emailNorm);
  const snap = await getDoc(otpDocRef);
  
  if (!snap.exists()) {
    throw new Error("No active recovery request found for this email. Please request a new passcode.");
  }
  
  const data = snap.data();
  if (!data || !data.passcode) {
    throw new Error("Invalid passcode record. Please try again.");
  }
  
  // Check if expired
  if (data.expiresAt) {
    const expired = new Date() > new Date(data.expiresAt);
    if (expired) {
      throw new Error("The recovery passcode has expired (10-minute limit). Please request a new one.");
    }
  }
  
  if (data.passcode !== rawOtpInput) {
    throw new Error("Incorrect passcode. Please check the email and try again.");
  }
  
  return true;
}
