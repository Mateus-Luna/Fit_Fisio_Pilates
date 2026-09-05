import { useEffect, useState } from 'react';

import {
  studentsService,
  type Student,
  type StudentType,
} from '../../services/students.service';

import {
  familiesService,
  type Family,
} from '../../services/families.service';

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [type, setType] = useState<StudentType>('ADULT');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [observation, setObservation] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [familyId, setFamilyId] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [studentsData, familiesData] = await Promise.all([
        studentsService.findAll(),
        familiesService.findAll(),
      ]);

      setStudents(studentsData);
      setFamilies(familiesData);
    } catch {
      setError('Não foi possível carregar os estudantes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setName('');
    setBirthDate('');
    setType('ADULT');
    setPhone('');
    setAddress('');
    setObservation('');
    setRg('');
    setCpf('');
    setFamilyId('');
    setEditingStudent(null);
  }

  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
  }

  function openEditForm(student: Student) {
    setEditingStudent(student);

    setName(student.name);
    setBirthDate(student.birthDate.slice(0, 10));
    setType(student.type);
    setPhone(student.phone);
    setAddress(student.address ?? '');
    setObservation(student.observation ?? '');
    setRg(student.rg ?? '');
    setCpf(student.cpf ?? '');
    setFamilyId(student.familyId ?? '');

    setIsFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !birthDate || !phone.trim()) {
      setError('Preencha nome, data de nascimento e telefone.');
      return;
    }

    try {
      setError('');

      const data = {
        name: name.trim(),
        birthDate,
        type,
        phone: phone.trim(),
        address: address.trim() || undefined,
        observation: observation.trim() || undefined,
        rg: type === 'ADULT' ? rg.trim() || undefined : undefined,
        cpf: type === 'ADULT' ? cpf.trim() || undefined : undefined,
        familyId: familyId || undefined,
      };

      if (editingStudent) {
        await studentsService.update(editingStudent.id, data);
      } else {
        await studentsService.create(data);
      }

      resetForm();
      setIsFormOpen(false);

      await loadData();
    } catch {
      setError(
        editingStudent
          ? 'Não foi possível atualizar o estudante.'
          : 'Não foi possível cadastrar o estudante.',
      );
    }
  }

  async function handleDeactivate(student: Student) {
    try {
      setError('');

      await studentsService.deactivate(student.id);

      await loadData();
    } catch {
      setError('Não foi possível desativar o estudante.');
    }
  }

  async function handleActivate(student: Student) {
    try {
      setError('');

      await studentsService.activate(student.id);

      await loadData();
    } catch {
      setError('Não foi possível ativar o estudante.');
    }
  }

  async function handleDelete(student: Student) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${student.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await studentsService.remove(student.id);

      await loadData();
    } catch {
      setError(
        'Não foi possível excluir o estudante. Verifique se ele possui matrículas.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Estudantes</h1>

          <p className="text-sm text-muted-foreground">
            Gerencie os estudantes cadastrados no FitFisio.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Novo estudante
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
              {editingStudent ? 'Editar estudante' : 'Novo estudante'}
            </h2>

            <p className="text-sm text-muted-foreground">
              Preencha os dados do estudante.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nome
              </label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome completo"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Data de nascimento
                </label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tipo
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as StudentType)
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ADULT">Adulto</option>
                  <option value="CHILD">Criança</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Telefone
                </label>

                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(83) 99999-9999"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Família
                </label>

                <select
                  value={familyId}
                  onChange={(event) => setFamilyId(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Nenhuma família</option>

                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {type === 'ADULT' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    RG
                  </label>

                  <input
                    value={rg}
                    onChange={(event) => setRg(event.target.value)}
                    placeholder="RG"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    CPF
                  </label>

                  <input
                    value={cpf}
                    onChange={(event) => setCpf(event.target.value)}
                    placeholder="CPF"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Endereço
              </label>

              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Endereço"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Observação
              </label>

              <textarea
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="Observações..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
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
                {editingStudent ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Carregando estudantes...
          </div>
        ) : students.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-medium">Nenhum estudante cadastrado</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre um estudante para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{student.name}</p>

                    <span
                      className={
                        student.active
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                          : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
                      }
                    >
                      {student.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {student.type === 'ADULT' ? 'Adulto' : 'Criança'}
                    {' • '}
                    {calculateAge(student.birthDate)} anos
                    {' • '}
                    {formatDate(student.birthDate)}
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {student.phone}
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    Família:{' '}
                    {student.family?.name ?? 'Nenhuma'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(student)}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    Editar
                  </button>

                  {student.active ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(student)}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Desativar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(student)}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Ativar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(student)}
                    className="rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}