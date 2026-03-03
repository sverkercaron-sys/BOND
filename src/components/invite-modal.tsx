"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { createInvite, getInviteUrl } from "@/lib/invite";
import { toast } from "sonner";
import { Share2, Copy } from "lucide-react";

export type InviteType = "partner" | "friend";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InviteType;
  coupleId: string;
  onSuccess?: () => void;
}

export default function InviteModal({
  isOpen,
  onClose,
  type,
  coupleId,
  onSuccess,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const supabase = createClient();

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Du måste vara inloggad");
        return;
      }

      // Create invite
      const invite = await createInvite(supabase, user.id, coupleId, type);
      const url = getInviteUrl(invite.token);
      setInviteLink(url);

      // TODO: Send email invitation here
      // await sendInviteEmail(email, url, type);

      toast.success("Inbjudan skickad!");
      setEmail("");
      onSuccess?.();
    } catch (error) {
      toast.error("Kunde inte skicka inbjudan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Länk kopierad!");
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    const shareText =
      type === "partner"
        ? "Bjud in din partner till BOND - låt oss växa tillsammans!"
        : "Gå med i BOND tillsammans med ditt par!";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "BOND",
          text: shareText,
          url: inviteLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {type === "partner" ? "Bjud in din partner" : "Bjud in ett par"}
          </h2>
          <p className="text-gray-600 mb-6">
            {type === "partner"
              ? "Dela denna länk eller e-post-adress för att få din partner att gå med."
              : "Dela denna länk eller e-post-adress för att bjuda in ett par."}
          </p>

          <form onSubmit={handleSendInvite} className="space-y-4 mb-6">
            <Input
              type="email"
              placeholder="E-postadress"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            <Button
              type="submit"
              disabled={!email || isLoading}
              className="w-full"
            >
              {isLoading ? "Skickar..." : "Skicka inbjudan"}
            </Button>
          </form>

          {inviteLink && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <p className="text-sm text-gray-600 font-medium">
                Eller dela denna länk:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border rounded text-sm text-gray-600"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="px-3"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {navigator.share && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Dela
                </Button>
              )}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Stäng
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
