'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface UserWithCouple extends User {
  couple: { streak: number } | null;
}

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserWithCouple[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithCouple[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithCouple | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          role,
          created_at,
          couple:couples(streak)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(
        data.map((u: any) => ({
          ...u,
          couple: u.couple && u.couple.length > 0 ? u.couple[0] : null,
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, role: newRole } : null
        );
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Kunde inte ändra roll');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete user from auth and database
      const { error } = await supabase.auth.admin.deleteUser(userToDelete);

      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Kunde inte ta bort användare');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Laddar användare...</p>
        </div>
      </div>
    );
  }

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Användarhantering</h1>
        <p className="text-gray-600 mt-2">Hantera alla BOND-användare</p>
      </div>

      {/* Search */}
      <Card className="p-6">
        <Input
          placeholder="Sök efter e-post..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </Card>

      {/* Users Table */}
      <Card className="p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                E-post
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Roll
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Par-status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Streak
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Registrerad
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedUser(user);
                  setSelectedRole(user.role);
                  setShowDetailsDialog(true);
                }}
              >
                <td className="py-3 px-4 text-gray-900">{user.email}</td>
                <td className="py-3 px-4">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Användare'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {user.couple ? 'Ihopkopplad' : 'Ensamstående'}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {user.couple?.streak || '-'}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('sv-SE')}
                </td>
                <td className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToDelete(user.id);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Sida {currentPage} av {totalPages}
            </p>
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Föregående
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Nästa
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Användardetaljer</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-post
                </label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => {
                    const newRole = value as 'user' | 'admin';
                    setSelectedRole(newRole);
                    handleChangeRole(selectedUser.id, newRole);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Användare</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Par-status
                </label>
                <p className="text-gray-900">
                  {selectedUser.couple ? 'Ihopkopplad' : 'Ensamstående'}
                </p>
              </div>

              {selectedUser.couple && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Streak
                  </label>
                  <p className="text-gray-900">{selectedUser.couple.streak} dagar</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registrerad
                </label>
                <p className="text-gray-600">
                  {new Date(selectedUser.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Ta bort användare</AlertDialogTitle>
          <AlertDialogDescription>
            Är du säker på att du vill ta bort denna användare? Denna åtgärd kan
            inte ångras.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">
              Ta bort
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
