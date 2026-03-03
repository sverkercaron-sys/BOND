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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  duration: number;
  difficulty: number;
  day_number: number | null;
  is_active: boolean;
  sort_order: number;
}

const CATEGORIES = ['Emotional', 'Physical', 'Communication', 'Adventure', 'Surprise'];
const DIFFICULTIES = [1, 2, 3];

export default function ExercisesPage() {
  const supabase = createClient();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    duration: 15,
    difficulty: 1,
    day_number: '',
    is_active: true,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        title: exercise.title,
        description: exercise.description,
        instructions: exercise.instructions,
        category: exercise.category,
        duration: exercise.duration,
        difficulty: exercise.difficulty,
        day_number: exercise.day_number?.toString() || '',
        is_active: exercise.is_active,
      });
    } else {
      setEditingExercise(null);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        category: '',
        duration: 15,
        difficulty: 1,
        day_number: '',
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSaveExercise = async () => {
    if (!formData.title || !formData.category) {
      alert('Titel och kategori är obligatoriska');
      return;
    }

    try {
      const exerciseData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        category: formData.category,
        duration: formData.duration,
        difficulty: formData.difficulty,
        day_number: formData.day_number ? parseInt(formData.day_number) : null,
        is_active: formData.is_active,
      };

      if (editingExercise) {
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', editingExercise.id);

        if (error) throw error;

        setExercises((prev) =>
          prev.map((e) =>
            e.id === editingExercise.id ? { ...e, ...exerciseData } : e
          )
        );
      } else {
        const { data, error } = await supabase
          .from('exercises')
          .insert([exerciseData])
          .select()
          .single();

        if (error) throw error;
        setExercises((prev) => [...prev, data]);
      }

      setShowDialog(false);
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Kunde inte spara övningen');
    }
  };

  const handleDeleteExercise = async () => {
    if (!exerciseToDelete) return;

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseToDelete);

      if (error) throw error;

      setExercises((prev) => prev.filter((e) => e.id !== exerciseToDelete));
      setShowDeleteDialog(false);
      setExerciseToDelete(null);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Kunde inte ta bort övningen');
    }
  };

  const handleToggleActive = async (exercise: Exercise) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ is_active: !exercise.is_active })
        .eq('id', exercise.id);

      if (error) throw error;

      setExercises((prev) =>
        prev.map((e) =>
          e.id === exercise.id ? { ...e, is_active: !e.is_active } : e
        )
      );
    } catch (error) {
      console.error('Error toggling exercise:', error);
      alert('Kunde inte uppdatera övningen');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Laddar övningar...</p>
        </div>
      </div>
    );
  }

  const filteredExercises =
    selectedCategory === 'all'
      ? exercises
      : exercises.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Övningshantering</h1>
          <p className="text-gray-600 mt-2">Hantera övningar och kategorier</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Skapa ny övning
        </Button>
      </div>

      {/* Category Tabs */}
      <Card>
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full"
        >
          <TabsList className="w-full justify-start border-b rounded-none">
            <TabsTrigger value="all">Alla</TabsTrigger>
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Titel
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Kategori
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Svårighet
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tid (min)
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Dag#
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExercises.map((exercise) => (
                    <tr
                      key={exercise.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {exercise.title}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{exercise.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {exercise.difficulty}/3
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {exercise.duration}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(exercise)}
                          className={
                            exercise.is_active
                              ? 'border-green-300 text-green-700'
                              : 'border-red-300 text-red-700'
                          }
                        >
                          {exercise.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Button>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {exercise.day_number || '-'}
                      </td>
                      <td className="py-3 px-4 space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(exercise)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setExerciseToDelete(exercise.id);
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

              {filteredExercises.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600">Inga övningar i denna kategori</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Exercise Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? 'Redigera övning' : 'Skapa ny övning'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel *
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="T.ex. Romantic dinner date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivning
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Kort beskrivning av övningen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instruktioner
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                placeholder="Detaljerade instruktioner för övningen"
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Svårighetsgrad
                </label>
                <Select
                  value={formData.difficulty.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, difficulty: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((diff) => (
                      <SelectItem key={diff} value={diff.toString()}>
                        {diff}/3
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Varaktighet (minuter)
                </label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 15,
                    })
                  }
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dag nummer (valfritt)
                </label>
                <Input
                  type="number"
                  value={formData.day_number}
                  onChange={(e) =>
                    setFormData({ ...formData, day_number: e.target.value })
                  }
                  placeholder="T.ex. 1, 7, 30"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Aktiv övning
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveExercise}>
                {editingExercise ? 'Uppdatera' : 'Skapa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Ta bort övning</AlertDialogTitle>
          <AlertDialogDescription>
            Är du säker på att du vill ta bort denna övning? Denna åtgärd kan
            inte ångras.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExercise} className="bg-red-600">
              Ta bort
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
