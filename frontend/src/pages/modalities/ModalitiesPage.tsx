import { useEffect, useState } from 'react';

import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ModalitiesPage() {
  const [modalities, setModalities] = useState<Modality[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModality, setEditingModality] =
    useState<Modality | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [requiresClass, setRequiresClass] = useState(false);
  const [capacityMode, setCapacityMode] = useState<'unlimited' | 'limited'>('unlimited');
  const [capacity, setCapacity] = useState('');

  async function loadModalities() {
    try {
      setLoading(true);
      setError('');

      const data = await modalitiesService.findAll();

      setModalities(data);
    } catch {
      setError('Não foi possível carregar as modalidades.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModalities();
  }, []);

  function resetForm() {
    setName('');
    setDescription('');
    setMonthlyPrice('');
    setRequiresClass(false);
    setCapacityMode('unlimited');
    setCapacity('');
    setEditingModality(null);
  }

  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
  }

  function openEditForm(modality: Modality) {
    setEditingModality(modality);

    setName(modality.name);
    setDescription(modality.description ?? '');
    setMonthlyPrice(String(modality.monthlyPrice));
    setRequiresClass(modality.requiresClass);
    const hasCap =
      modality.capacity !== null &&
      modality.capacity !== undefined &&
      Number(modality.capacity) > 0;
    setCapacityMode(hasCap ? 'limited' : 'unlimited');
    setCapacity(hasCap ? String(modality.capacity) : '');

    setIsFormOpen(true);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError('Informe o nome da modalidade.');
      return;
    }

    const price = Number(monthlyPrice);

    if (Number.isNaN(price) || price < 0) {
      setError('Informe um preço mensal válido.');
      return;
    }

    let parsedCapacity: number | null = null;
    if (capacityMode === 'limited') {
      parsedCapacity = Number(capacity);
      if (!capacity || Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
        setError(
          'Informe um limite de alunos válido (número maior que zero).',
        );
        return;
      }
    }

    if (requiresClass && (!parsedCapacity || parsedCapacity < 1)) {
      setError(
        'Modalidades que exigem turma fixa necessitam de uma capacidade definida de alunos.',
      );
      return;
    }

    try {
      setError('');

      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        monthlyPrice: price,
        requiresClass,
        capacity: parsedCapacity,
      };

      if (editingModality) {
        await modalitiesService.update(
          editingModality.id,
          data,
        );
      } else {
        await modalitiesService.create(data);
      }

      resetForm();
      setIsFormOpen(false);

      await loadModalities();
    } catch {
      setError(
        editingModality
          ? 'Não foi possível atualizar a modalidade.'
          : 'Não foi possível cadastrar a modalidade.',
      );
    }
  }

  async function handleDeactivate(modality: Modality) {
    try {
      setError('');

      await modalitiesService.deactivate(modality.id);

      await loadModalities();
    } catch {
      setError('Não foi possível desativar a modalidade.');
    }
  }

  async function handleActivate(modality: Modality) {
    try {
      setError('');

      await modalitiesService.activate(modality.id);

      await loadModalities();
    } catch {
      setError('Não foi possível ativar a modalidade.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Modalidades
          </h1>

          <p className="text-sm text-muted-foreground">
            Gerencie as modalidades oferecidas pelo FitFisio.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Nova modalidade
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              {editingModality
                ? 'Editar modalidade'
                : 'Nova modalidade'}
            </h2>

            <p className="text-sm text-muted-foreground">
              Informe os dados da modalidade.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nome
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ex.: Pilates"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Descrição
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Descrição da modalidade..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Preço mensal
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyPrice}
                  onChange={(event) =>
                    setMonthlyPrice(event.target.value)
                  }
                  placeholder="0,00"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Exige turma?
                </label>

                <select
                  value={requiresClass ? 'yes' : 'no'}
                  onChange={(event) => {
                    const isYes = event.target.value === 'yes';
                    setRequiresClass(isYes);
                    if (isYes && capacityMode === 'unlimited') {
                      setCapacityMode('limited');
                      if (!capacity) setCapacity('8');
                    }
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="no">Não (Acesso livre / Horário flexível)</option>
                  <option value="yes">Sim (Aulas em turmas com vagas)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Capacidade de alunos
                </label>

                <select
                  value={capacityMode}
                  onChange={(event) => {
                    const mode = event.target.value as 'unlimited' | 'limited';
                    setCapacityMode(mode);
                    if (mode === 'unlimited') {
                      setCapacity('');
                      if (requiresClass) {
                        setRequiresClass(false);
                      }
                    } else if (!capacity) {
                      setCapacity('8');
                    }
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="unlimited">Sem limite fixo de turma</option>
                  <option value="limited">Definir limite de alunos (1, 2, 3...)</option>
                </select>
              </div>

              {capacityMode === 'limited' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Limite máximo de alunos {requiresClass ? 'por turma' : '(geral)'}
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={capacity}
                    onChange={(event) =>
                      setCapacity(event.target.value)
                    }
                    placeholder="Ex.: 8"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status do limite
                  </label>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Sem limite fixo de turma
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {editingModality
                  ? 'Salvar alterações'
                  : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Carregando modalidades...
          </div>
        ) : modalities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-medium">
              Nenhuma modalidade cadastrada
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre uma modalidade para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {modalities.map((modality) => (
              <div
                key={modality.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {modality.name}
                    </p>

                    <span
                      className={
                        modality.active
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                          : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
                      }
                    >
                      {modality.active
                        ? 'Ativa'
                        : 'Inativa'}
                    </span>
                  </div>

                  {modality.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {modality.description}
                    </p>
                  )}

                  <div className="mt-1 text-sm text-muted-foreground">
                    Mensalidade:{' '}
                    {formatCurrency(
                      modality.monthlyPrice,
                    )}
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {modality.requiresClass
                      ? `Exige turma • Capacidade: ${modality.capacity}`
                      : 'Não exige turma'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(modality)
                    }
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    Editar
                  </button>

                  {modality.active ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeactivate(modality)
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Desativar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleActivate(modality)
                      }
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Ativar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}