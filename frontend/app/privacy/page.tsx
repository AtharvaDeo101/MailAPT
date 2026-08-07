import type { Metadata } from "next";
import { InfoPage } from "@/components/landing/info-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Dispatch",
  description: "What Dispatch accesses, what it stores, what it sends to third parties, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="Dispatch reads your mail so it can be a mail client. This page says exactly what it touches, what it keeps, and what leaves the server."
      updated="7 August 2026"
      sections={[
        {
          heading: "1. Google account access",
          paragraphs: [
            "Signing in grants Dispatch these Gmail scopes through Google OAuth:",
          ],
          bullets: [
            "gmail.readonly — read messages, threads, labels and settings, so the inbox and reading pane can display them.",
            "gmail.modify — mark as read, apply labels, move messages and delete to Trash.",
            "gmail.send — send the mail you compose or schedule.",
          ],
        },
        {
          heading: "2. What Dispatch does with that access",
          paragraphs: [
            "Message content is fetched from Gmail when you open a folder or a message, and is used to render the interface in your browser. Messages you never open are never fetched.",
            "Dispatch does not mirror, index or bulk-download your mailbox, and does not read your mail for advertising, profiling or model training.",
            "Your Google OAuth tokens are held in a server-side session that expires after 30 minutes of inactivity. They are never sent to your browser or to any third party.",
          ],
        },
        {
          heading: "3. What is stored on Dispatch's server",
          paragraphs: [
            "A Postgres database stores only what the app's own features need:",
          ],
          bullets: [
            "Emails you compose in Dispatch — subject, body, sender and recipient — for drafts and scheduled sends.",
            "Scheduled send times and their status (pending, sent, failed).",
            "Custom folders you create, and which messages you filed into them.",
            "To-do lists and notes you create in the side rail.",
            "Per-account settings, keyed to your Gmail address.",
            "Ordinary server logs, including request paths, timestamps and errors.",
          ],
        },
        {
          heading: "4. What is not stored",
          bullets: [
            "Your Google password — Dispatch never sees it; sign-in happens on Google's own pages.",
            "The contents of your inbox. Received mail is fetched live from Gmail and is not copied into Dispatch's database.",
            "Payment details — Dispatch does not take payments.",
          ],
        },
        {
          heading: "5. AI processing",
          paragraphs: [
            "AI drafting and summarisation send text to the Hugging Face Inference API, which runs meta-llama/Llama-3.1-8B-Instruct.",
            "Only the text needed for that one request is sent: the prompt you typed when generating, or the body of the single message you asked to summarise. Your mailbox as a whole is never sent, and no request is made unless you trigger one.",
            "Hugging Face's own privacy policy governs what happens to that text on their infrastructure.",
          ],
        },
        {
          heading: "6. Limited Use",
          paragraphs: [
            "Dispatch's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
            "Gmail data is used only to provide the features described on this site, is not transferred to others except as needed to provide those features or as required by law, is not used for advertising, and is not read by humans except with your explicit permission, for security purposes, or where required by law.",
          ],
        },
        {
          heading: "7. Sharing",
          paragraphs: [
            "Your data is not sold, rented or traded. It is shared only with the infrastructure providers Dispatch runs on: Google (Gmail API) and Hugging Face (model inference), each strictly to deliver the features you invoke.",
          ],
        },
        {
          heading: "8. Security",
          paragraphs: [
            "Traffic to Google and Hugging Face runs over HTTPS. Sessions are stored server-side, are cookie-scoped to the app, and expire after 30 minutes of inactivity. Rendered email HTML is sanitised before display to block scripts embedded in messages.",
            "No system is perfectly secure. Dispatch cannot guarantee absolute security, and you should treat access to the account you sign in with as the primary line of defence.",
          ],
        },
        {
          heading: "9. Your choices",
          bullets: [
            "Revoke access at any time from your Google Account permissions page — Dispatch loses all mailbox access immediately.",
            "Delete your drafts, schedules, folders, to-dos and notes from inside the app at any time.",
            "Request deletion of everything Dispatch holds for your account by emailing atharva20051@gmail.com from the Google address you signed in with.",
          ],
        },
        {
          heading: "10. Children",
          paragraphs: [
            "Dispatch is not directed at children under 13, and is not knowingly used to collect their data.",
          ],
        },
        {
          heading: "11. Changes and contact",
          paragraphs: [
            "This policy may be updated; the date at the top of this page reflects the latest version.",
            "Privacy questions and data requests go to atharva20051@gmail.com.",
          ],
        },
      ]}
    />
  );
}
