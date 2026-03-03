'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Unlink } from 'lucide-react';

interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  streak: number;
  created_at: string;
  completed_exercises: number;
  user1: { email: string };
  user2: { email: string };
}

export default function CouplesPage() {
  const supabase = createClient();
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [coupleToDisconnect, setCoupleToDisconnect] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCouples();
  }, []);

  const fetchCouples = async () => {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select(
          `
          id,
          user1_id,
          user2_id,
          streak,
          created_at,
          user1:user1_id(email),
          user2:user2_id(email)
        `
        )
        .not('user2_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count completed exercises for each couple
      const couplesWithCounts = await Promise.all(
        (data || []).map(async (couple: any) => {
          const { count } = await supabase
            .from('completions')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${couple.user1_id},user_id.eq.${couple.user2_id}`);

          return {
            ...couple,
            completed_exercises: count || 0,
          };
        })
      );

      setCouples(couplesWithCounts);
    } catch (error) {
      console.error('Error fetching couples:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectCouple = async () => {
    if (!coupleToDisconnect) return;

    try {
      const { error } = await supabase
        .from('couples')
        .update({ user2_id: null })
        .eq('id', coupleToDisconnect);

      if (error) throw error;

      setCouples((prev) => prev.filter((c) => c.id !== coupleToDisconnect));
      setShowDisconnectDialog(false);
      setCoupleToDisconnect(null);
    } catch (error) {
      console.error('Error disconnecting couple:', error);
      alert('Kunde inte koppla från paret');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Laddar par...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Par-hantering</h1>
        <p className="text-gray-600 mt-2">Hantera alla ihopkopplade par</p>
      </div>

      {/* Couples Table */}
      <Card className="p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Användare 1
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Användare 2
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Streak
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Totalt övningar
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Skapad
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody>
            {couples.map((couple) => (
              <tr
                key={couple.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedCouple(couple);
                  setShowDetailsDialog(true);
                }}
              >
                <td className="py-3 px-4 text-gray-900">
                  {couple.user1?.email}
                </td>
                <td className="py-3 px-4 text-gray-900">
                  {couple.user2?.email}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="default">{couple.streak} dagar</Badge>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {couple.completed_exercises}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(couple.created_at).toLocaleDateString('sv-SE')}
                </td>
                <td className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoupleToDisconnect(couple.id);
                      setShowDisconnectDialog(true);
                    }}
                  >
                    <Unlink className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {couples.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Inga ihopkopplade par hittades</p>
          </div>
        )}
      </Card>

      {/* Couple Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Par-detaljer</DialogTitle>
          </DialogHeader>
          {selectedCouple && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Användare 1
                </label>
                <p className="text-gray-900">{selectedCouple.user1?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Användare 2
                </label>
                <p className="text-gray-900">{selectedCouple.user2?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Streak
                </label>
                <p className="text-gray-900">{selectedCouple.streak} dagar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Totalt genomförda övningar
                </label>
                <p className="text-gray-900">{selectedCouple.completed_exercises}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skapad
                </label>
                <p className="text-gray-600">
                  {new Date(selectedCouple.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Koppla från par</AlertDialogTitle>
          <AlertDialogDescription>
            Är du säker på att du vill koppla från detta par? Paret kommer att
            bli två enskilda användare.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectCouple} className="bg-red-600">
              Koppla från
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
