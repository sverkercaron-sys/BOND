"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { couple, partner } = useCouple();
  const supabase = createClient();

  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notification_time ? true : false
  );
  const [notificationHour, setNotificationHour] = useState(19);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDisconnectingPartner, setIsDisconnectingPartner] = useState(false);

  const handleSaveName = async () => {
    if (!user) return;

    setIsSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name },
      });

      if (error) throw error;

      toast.success("Namn sparad!");
      setIsEditingName(false);
    } catch (error) {
      toast.error("Kunde inte spara namn");
      console.error(error);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveNotificationTime = async () => {
    if (!user) return;

    setIsSavingTime(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          notification_time: notificationsEnabled
            ? `${String(notificationHour).padStart(2, "0")}:00`
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(
        notificationsEnabled ? "Påminnelser aktiverade!" : "Påminnelser inaktiverade!"
      );
    } catch (error) {
      toast.error("Kunde inte spara påminnelsesinställningar");
      console.error(error);
    } finally {
      setIsSavingTime(false);
    }
  };

  const handleDisconnectPartner = async () => {
    if (!couple) return;

    setIsDisconnectingPartner(true);
    try {
      const { error } = await supabase
        .from("couples")
        .update({
          user2_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", couple.id);

      if (error) throw error;

      toast.success("Partner bortkopplad");
    } catch (error) {
      toast.error("Kunde inte koppla bort partner");
      console.error(error);
    } finally {
      setIsDisconnectingPartner(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      // Fetch all user data
      const [userData, coupleData, exercisesData, invitesData] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        couple
          ? supabase.from("couples").select("*").eq("id", couple.id).single()
          : null,
        supabase
          .from("user_exercises")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("invites")
          .select("*")
          .or(
            `inviter_id.eq.${user.id},accepted_by.eq.${user.id}`
          ),
      ]);

      const exportData = {
        user: userData.data,
        couple: coupleData?.data,
        exercises: exercisesData.data,
        invites: invitesData.data,
        exportedAt: new Date().toISOString(),
      };

      // Create download
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," +
          encodeURIComponent(JSON.stringify(exportData, null, 2))
      );
      element.setAttribute("download", `bond-data-${Date.now()}.json`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success("Data exporterad!");
    } catch (error) {
      toast.error("Kunde inte exportera data");
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "RADERA") return;

    setIsDeletingAccount(true);
    try {
      // Delete user data first
      await supabase.from("user_exercises").delete().eq("user_id", user.id);
      await supabase.from("invites").delete().eq("inviter_id", user.id);

      if (couple) {
        await supabase
          .from("couples")
          .update({ user2_id: null })
          .eq("user2_id", user.id);
      }

      await supabase.from("users").delete().eq("id", user.id);

      // Delete auth account
      await supabase.auth.admin.deleteUser(user.id);

      toast.success("Konto raderat");
      signOut();
    } catch (error) {
      toast.error("Kunde inte radera konto");
      console.error(error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Inställningar</h1>

        {/* Profile section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Profil</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Namn
              </label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ditt namn"
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    size="sm"
                  >
                    Spara
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingName(false)}
                    size="sm"
                  >
                    Avbryt
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-900">{name || "Inget namn"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                  >
                    Redigera
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <div className="p-3 bg-gray-50 rounded text-gray-900">
                {user?.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Kan inte ändras här
              </p>
            </div>
          </div>
        </Card>

        {/* Partner section */}
        {couple && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Din partner</h2>

            <div className="p-4 bg-blue-50 rounded mb-4 border border-blue-200">
              <p className="text-gray-900 font-medium">
                {partner?.user_metadata?.name || "Partner"}
              </p>
              <p className="text-sm text-gray-600">{partner?.email}</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Koppla bort partner</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Är du säker?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Om du kopplar bort din partner kan ni inte längre dela
                    övningar tillsammans. Du kan bjuda in en ny partner senare.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-3">
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnectPartner}
                    disabled={isDisconnectingPartner}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDisconnectingPartner
                      ? "Kopplar bort..."
                      : "Koppla bort"}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        )}

        {/* Notification section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Notifikationer
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Påminnelser aktiverade
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Du får en daglig påminnelse att göra övningen
                </p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {notificationsEnabled && (
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Påminnelsetid
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNotificationHour(
                        notificationHour === 0 ? 23 : notificationHour - 1
                      )
                    }
                  >
                    −
                  </Button>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {String(notificationHour).padStart(2, "0")}
                    </div>
                    <div className="text-sm text-gray-500">:00</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNotificationHour(
                        notificationHour === 23 ? 0 : notificationHour + 1
                      )
                    }
                  >
                    +
                  </Button>
                </div>
                <Button
                  onClick={handleSaveNotificationTime}
                  disabled={isSavingTime}
                  className="w-full"
                >
                  Spara tid
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Data & Privacy section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Data & Integritet
          </h2>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="w-full justify-start"
            >
              Exportera min data
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  Radera mitt konto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Radera mitt konto
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta kan inte ångras. All dina data kommer att raderas permanent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Skriv RADERA för att bekräfta"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  />
                  <div className="flex gap-3">
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteConfirmText !== "RADERA" || isDeletingAccount
                      }
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeletingAccount ? "Raderar..." : "Radera konto"}
                    </AlertDialogAction>
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        {/* About section */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Om BOND</h2>

          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">Version</p>
              <p>1.0.0</p>
            </div>

            <div>
              <p className="font-medium text-gray-900">Feedback</p>
              <Button
                variant="link"
                className="p-0 h-auto"
                asChild
              >
                <a href="mailto:hello@bond.se">Skicka oss feedback</a>
              </Button>
            </div>

            <div className="pt-3 border-t">
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={signOut}
              >
                Logga ut
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
