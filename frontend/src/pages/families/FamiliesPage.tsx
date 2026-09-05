import { useEffect, useState } from 'react';

import {
  familiesService,
  type Family,
} from '../../services/families.service';

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [name, setName] = useState('');
  const [observation, setObservation] = useState('');

  async function loadFamilies() {
    try {
      setLoading(true);
      setError('');

      const data = await familiesService.findAll();

      setFamilies(data);
    } catch {
      setError('Não foi possível carregar as famílias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFamilies();
  }, []);

  async function handleCreateFamily(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      await familiesService.create({
        name: name.trim(),
        observation: observation.trim() || undefined,
      });

      setName('');
      setObservation('');
      setIsFormOpen(false);

      await loadFamilies();
    } catch {
      setError('Não foi possível cadastrar a família.');
    }
  }

  async function handleDeleteFamily(id: string) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta família?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await familiesService.remove(id);
      await loadFamilies();
    } catch {
      setError(
        'Não foi possível excluir a família. Verifique se existem alunos associados.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Famílias
          </h1>

          <p className="text-sm text-muted-foreground">
            Gerencie as famílias e seus alunos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Nova família
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Nova família
          </h2>

          <form
            onSubmit={handleCreateFamily}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nome da família
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ex.: Família Silva"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Observação
              </label>

              <textarea
                value={observation}
                onChange={(event) =>
                  setObservation(event.target.value)
                }
                placeholder="Observações sobre a família..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Carregando famílias...
          </div>
        ) : families.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-medium">
              Nenhuma família cadastrada
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre uma família para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {families.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium">
                    {family.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {family.students.length}{' '}
                    {family.students.length === 1
                      ? 'aluno'
                      : 'alunos'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteFamily(family.id)
                  }
                  className="text-sm text-destructive hover:underline"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}