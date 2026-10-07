const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Database persistence file
const DB_FILE = path.join(__dirname, 'data_store.json');

const INITIAL_DATA = {
  users: [
    {
      id: 'usr-1',
      name: 'Aline',
      email: 'aline@fitfisio.com.br',
      password: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  families: [
    {
      id: 'fam-1',
      name: 'Família Silva',
      observation: 'Desconto familiar aplicado',
      createdAt: new Date('2026-01-10').toISOString(),
      updatedAt: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'fam-2',
      name: 'Família Oliveira',
      observation: 'Pais e filhos matriculados na natação',
      createdAt: new Date('2026-02-15').toISOString(),
      updatedAt: new Date('2026-02-15').toISOString(),
    },
  ],
  modalities: [
    {
      id: 'mod-1',
      name: 'Pilates',
      description: 'Aulas personalizadas de pilates em aparelhos e solo',
      monthlyPrice: 220,
      requiresClass: false,
      capacity: null,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-2',
      name: 'Fisioterapia',
      description: 'Atendimento clínico e reabilitação postural',
      monthlyPrice: 180,
      requiresClass: false,
      capacity: null,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-3',
      name: 'Hidroginástica',
      description: 'Exercícios aeróbicos aquáticos em grupo',
      monthlyPrice: 170,
      requiresClass: true,
      capacity: 8,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-4',
      name: 'Hidroterapia',
      description: 'Fisioterapia aquática para alívio articular',
      monthlyPrice: 240,
      requiresClass: true,
      capacity: 5,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-5',
      name: 'Natação Adulto',
      description: 'Aperfeiçoamento de técnicas e condicionamento',
      monthlyPrice: 190,
      requiresClass: true,
      capacity: 8,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-6',
      name: 'Natação Criança',
      description: 'Iniciação à natação e adaptação aquática infantil',
      monthlyPrice: 190,
      requiresClass: true,
      capacity: 8,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-7',
      name: 'Academia',
      description: 'Musculação e treino funcional assistido',
      monthlyPrice: 130,
      requiresClass: false,
      capacity: null,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
  ],
  students: [
    {
      id: 'std-1',
      name: 'Carlos Eduardo Silva',
      birthDate: '1990-04-12T00:00:00.000Z',
      phone: '(11) 98765-4321',
      address: 'Rua das Palmeiras, 142 - Centro',
      observation: 'Recuperação de lombalgia crônica',
      type: 'ADULT',
      rg: '34.567.890-1',
      cpf: '123.456.789-01',
      active: true,
      familyId: 'fam-1',
      createdAt: new Date('2026-02-01').toISOString(),
      updatedAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'std-2',
      name: 'Mariana Silva',
      birthDate: '1993-09-24T00:00:00.000Z',
      phone: '(11) 98765-4322',
      address: 'Rua das Palmeiras, 142 - Centro',
      observation: 'Pilates para fortalecimento do core',
      type: 'ADULT',
      rg: '42.123.456-7',
      cpf: '234.567.890-12',
      active: true,
      familyId: 'fam-1',
      createdAt: new Date('2026-02-05').toISOString(),
      updatedAt: new Date('2026-02-05').toISOString(),
    },
    {
      id: 'std-3',
      name: 'Lucas Oliveira',
      birthDate: '2017-06-18T00:00:00.000Z',
      phone: '(11) 99123-8877',
      address: 'Av. Brasil, 800 - Apto 32',
      observation: 'Autorização médica entregue para natação',
      type: 'CHILD',
      rg: null,
      cpf: null,
      active: true,
      familyId: 'fam-2',
      createdAt: new Date('2026-02-20').toISOString(),
      updatedAt: new Date('2026-02-20').toISOString(),
    },
  ],
  enrollments: [
    {
      id: 'enr-1',
      studentId: 'std-1',
      modalityId: 'mod-1',
      status: 'ACTIVE',
      startDate: new Date('2026-02-01').toISOString(),
      endDate: null,
      contractedPrice: 220,
      discountPercentage: 10,
      discountAmount: 22,
      finalPrice: 198,
      observation: 'Plano com desconto de família',
      createdAt: new Date('2026-02-01').toISOString(),
      updatedAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'enr-2',
      studentId: 'std-3',
      modalityId: 'mod-6',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01').toISOString(),
      endDate: null,
      contractedPrice: 190,
      discountPercentage: 0,
      discountAmount: 0,
      finalPrice: 190,
      observation: 'Turma de sábados manhã',
      createdAt: new Date('2026-02-20').toISOString(),
      updatedAt: new Date('2026-02-20').toISOString(),
    },
  ],
  settings: [
    {
      id: 'set-1',
      key: 'studio_name',
      value: 'FitFisio Pilates & Saúde',
      description: 'Nome do estúdio exibido nos relatórios e recibos',
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'set-2',
      key: 'contact_phone',
      value: '(11) 98765-4321',
      description: 'Telefone e WhatsApp oficial',
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'set-3',
      key: 'pix_key',
      value: 'financeiro@fitfisio.com.br',
      description: 'Chave Pix para pagamentos de mensalidades',
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
  ],
  classes: [
    {
      id: 'cls-1',
      name: 'Hidro Manhã (Seg/Qua 08:00)',
      modalityId: 'mod-3',
      capacity: 8,
      schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '08:50' }, { dayOfWeek: 3, startTime: '08:00', endTime: '08:50' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-2',
      name: 'Hidro Tarde (Ter/Qui 16:00)',
      modalityId: 'mod-3',
      capacity: 8,
      schedules: [{ dayOfWeek: 2, startTime: '16:00', endTime: '16:50' }, { dayOfWeek: 4, startTime: '16:00', endTime: '16:50' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-3',
      name: 'Hidroterapia Manhã (Ter/Qui 09:00)',
      modalityId: 'mod-4',
      capacity: 5,
      schedules: [{ dayOfWeek: 2, startTime: '09:00', endTime: '09:45' }, { dayOfWeek: 4, startTime: '09:00', endTime: '09:45' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-4',
      name: 'Natação Adulto Manhã (Seg/Qua/Sex 07:00)',
      modalityId: 'mod-5',
      capacity: 8,
      schedules: [{ dayOfWeek: 1, startTime: '07:00', endTime: '07:50' }, { dayOfWeek: 3, startTime: '07:00', endTime: '07:50' }, { dayOfWeek: 5, startTime: '07:00', endTime: '07:50' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-5',
      name: 'Natação Criança Tarde (Ter/Qui 15:00)',
      modalityId: 'mod-6',
      capacity: 8,
      schedules: [{ dayOfWeek: 2, startTime: '15:00', endTime: '15:45' }, { dayOfWeek: 4, startTime: '15:00', endTime: '15:45' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-6',
      name: 'Pilates Manhã (Seg/Qua 08:00)',
      modalityId: 'mod-1',
      capacity: 4,
      schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }, { dayOfWeek: 3, startTime: '08:00', endTime: '09:00' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
  ],
  documents: [],
  payments: [
    {
      id: 'pay-1',
      studentId: 'std-1',
      enrollmentId: 'enr-1',
      referenceMonth: 10,
      referenceYear: 2026,
      dueDate: new Date('2026-10-10').toISOString(),
      amount: 220,
      discountAmount: 22,
      finalAmount: 198,
      method: null,
      status: 'PENDING',
      paidAt: null,
      transactionId: null,
      receiptGenerated: false,
      observation: 'Mensalidade de Pilates - Outubro/2026',
      createdAt: new Date('2026-10-01').toISOString(),
      updatedAt: new Date('2026-10-01').toISOString(),
    },
    {
      id: 'pay-2',
      studentId: 'std-1',
      enrollmentId: 'enr-1',
      referenceMonth: 9,
      referenceYear: 2026,
      dueDate: new Date('2026-09-10').toISOString(),
      amount: 220,
      discountAmount: 22,
      finalAmount: 198,
      method: 'PIX',
      status: 'PAID',
      paidAt: new Date('2026-09-08').toISOString(),
      transactionId: 'E2E-987123654',
      receiptGenerated: true,
      observation: 'Mensalidade de Pilates - Setembro/2026',
      createdAt: new Date('2026-09-01').toISOString(),
      updatedAt: new Date('2026-09-08').toISOString(),
    },
    {
      id: 'pay-3',
      studentId: 'std-3',
      enrollmentId: 'enr-2',
      referenceMonth: 10,
      referenceYear: 2026,
      dueDate: new Date('2026-10-10').toISOString(),
      amount: 190,
      discountAmount: 0,
      finalAmount: 190,
      method: null,
      status: 'PENDING',
      paidAt: null,
      transactionId: null,
      receiptGenerated: false,
      observation: 'Mensalidade de Natação Criança - Outubro/2026',
      createdAt: new Date('2026-10-01').toISOString(),
      updatedAt: new Date('2026-10-01').toISOString(),
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'usr-1',
      studentId: 'std-1',
      type: 'SYSTEM',
      channel: 'SYSTEM',
      title: 'Sistema Financeiro Ativo',
      message: 'O módulo financeiro do FitFisio está pronto para gerenciar cobranças em PIX, Cartão e Dinheiro.',
      status: 'PENDING',
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data.classes || !Array.isArray(data.classes)) {
        data.classes = INITIAL_DATA.classes;
      }
      if (!data.documents || !Array.isArray(data.documents)) {
        data.documents = [];
      }
      if (!data.serviceReceipts || !Array.isArray(data.serviceReceipts)) {
        data.serviceReceipts = [];
      }
      if (!data.payments || !Array.isArray(data.payments)) {
        data.payments = INITIAL_DATA.payments;
      }
      if (!data.notifications || !Array.isArray(data.notifications)) {
        data.notifications = INITIAL_DATA.notifications;
      }
      return data;
    }
  } catch (err) {
    console.error('Error reading db file:', err);
  }
  saveDb(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

const db = loadDb();

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function generateId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post(['/auth/login', '/api/auth/login'], (req, res) => {
  const { email, password } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório.' });
  }

  // Find user or match default admin
  let user = db.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  // If no user exists yet in the database, seed Aline
  if (!user && (email.includes('aline') || db.users.length === 0)) {
    user = {
      id: generateId('usr'),
      name: 'Aline',
      email: email,
      password: password || 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
  }

  // For ease of use and testing, allow login if user exists
  if (!user || !user.active) {
    // If password provided and user not found, create a demo session for the user
    user = {
      id: generateId('usr'),
      name: email.split('@')[0],
      email: email,
      password: password,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
  }

  return res.json({
    accessToken: `token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post(['/auth/register', '/api/auth/register'], (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
  }

  const newUser = {
    id: generateId('usr'),
    name,
    email,
    password: password || '123',
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDb(db);

  return res.status(201).json({
    message: 'Usuário criado com sucesso.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
  });
});

app.get(['/auth/has-user', '/api/auth/has-user'], (req, res) => {
  res.json({ registered: db.users.length > 0 });
});

// -------------------------------------------------------------
// FAMILIES ROUTES
// -------------------------------------------------------------
app.get(['/families', '/api/families'], (req, res) => {
  const familiesWithStudents = db.families.map((f) => ({
    ...f,
    students: db.students.filter((s) => s.familyId === f.id),
  }));
  res.json(familiesWithStudents);
});

app.get(['/families/:id', '/api/families/:id'], (req, res) => {
  const family = db.families.find((f) => f.id === req.params.id);
  if (!family) {
    return res.status(404).json({ message: 'Família não encontrada.' });
  }
  const students = db.students.filter((s) => s.familyId === family.id);
  res.json({ ...family, students });
});

app.post(['/families', '/api/families'], (req, res) => {
  const { name, observation } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: 'O nome da família é obrigatório.' });
  }
  const newFamily = {
    id: generateId('fam'),
    name: name.trim(),
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.families.push(newFamily);
  saveDb(db);
  res.status(201).json({ ...newFamily, students: [] });
});

app.patch(['/families/:id', '/api/families/:id'], (req, res) => {
  const index = db.families.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Família não encontrada.' });
  }
  const { name, observation } = req.body;
  if (name !== undefined) db.families[index].name = name.trim();
  if (observation !== undefined) db.families[index].observation = observation;
  db.families[index].updatedAt = new Date().toISOString();
  saveDb(db);

  const students = db.students.filter((s) => s.familyId === db.families[index].id);
  res.json({ ...db.families[index], students });
});

app.delete(['/families/:id', '/api/families/:id'], (req, res) => {
  const index = db.families.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Família não encontrada.' });
  }
  // Disassociate students
  db.students.forEach((s) => {
    if (s.familyId === req.params.id) {
      s.familyId = null;
    }
  });
  db.families.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// MODALITIES ROUTES
// -------------------------------------------------------------
app.get(['/modalities', '/api/modalities'], (req, res) => {
  const sorted = [...db.modalities].sort((a, b) => a.name.localeCompare(b.name));
  res.json(sorted);
});

app.get(['/modalities/:id', '/api/modalities/:id'], (req, res) => {
  const modality = db.modalities.find((m) => m.id === req.params.id);
  if (!modality) {
    return res.status(404).json({ message: 'Modalidade não encontrada.' });
  }
  res.json(modality);
});

app.post(['/modalities', '/api/modalities'], (req, res) => {
  const { name, description, monthlyPrice, requiresClass, capacity, active } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: 'Nome da modalidade é obrigatório.' });
  }

  const newModality = {
    id: generateId('mod'),
    name: name.trim(),
    description: description || null,
    monthlyPrice: Number(monthlyPrice) || 0,
    requiresClass: Boolean(requiresClass),
    capacity: requiresClass ? (Number(capacity) || 8) : null,
    active: active !== undefined ? Boolean(active) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.modalities.push(newModality);
  saveDb(db);
  res.status(201).json(newModality);
});

app.patch(['/modalities/:id', '/api/modalities/:id'], (req, res) => {
  const index = db.modalities.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Modalidade não encontrada.' });
  }
  const body = req.body;
  const mod = db.modalities[index];
  if (body.name !== undefined) mod.name = body.name.trim();
  if (body.description !== undefined) mod.description = body.description;
  if (body.monthlyPrice !== undefined) {
    const newPrice = Number(body.monthlyPrice);
    mod.monthlyPrice = newPrice;

    // Atualizar cobranças PENDENTES de matrículas ativas dessa modalidade
    // Regra: Pagamentos históricos já pagos (PAID) NUNCA devem ser alterados.
    // Apenas cobranças ainda não pagas (PENDING) refletem o novo preço da modalidade.
    const activeEnrollments = (db.enrollments || []).filter(
      (e) => e.modalityId === mod.id && e.status === 'ACTIVE'
    );
    for (const enr of activeEnrollments) {
      const pct = Math.max(0, Math.min(100, Number(enr.discountPercentage) || 0));
      const totalDiscountAmount = Math.round((newPrice * (pct / 100)) * 100) / 100;
      const totalFinalAmount = Math.round((newPrice - totalDiscountAmount) * 100) / 100;

      const pendingPayments = (db.payments || []).filter(
        (p) => p.enrollmentId === enr.id && p.status === 'PENDING'
      );
      for (const p of pendingPayments) {
        if (p.period === 'FIRST_FORTNIGHT' || p.period === 'SECOND_FORTNIGHT') {
          const split = splitFortnightAmounts(newPrice, totalFinalAmount);
          const part = p.period === 'FIRST_FORTNIGHT' ? split.first : split.second;
          p.amount = part.amount;
          p.discountAmount = part.discountAmount;
          p.finalAmount = part.finalAmount;
        } else {
          p.amount = newPrice;
          p.discountAmount = totalDiscountAmount;
          p.finalAmount = totalFinalAmount;
        }
        p.updatedAt = new Date().toISOString();
      }
    }
  }
  if (body.requiresClass !== undefined) mod.requiresClass = Boolean(body.requiresClass);
  if (body.capacity !== undefined) mod.capacity = body.capacity ? Number(body.capacity) : null;
  if (body.active !== undefined) mod.active = Boolean(body.active);
  mod.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(mod);
});

app.patch(['/modalities/:id/activate', '/api/modalities/:id/activate'], (req, res) => {
  const mod = db.modalities.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  mod.active = true;
  mod.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(mod);
});

app.patch(['/modalities/:id/deactivate', '/api/modalities/:id/deactivate'], (req, res) => {
  const mod = db.modalities.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  mod.active = false;
  mod.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(mod);
});

// -------------------------------------------------------------
// STUDENTS ROUTES
// -------------------------------------------------------------
function enrichStudent(student) {
  const family = student.familyId ? db.families.find((f) => f.id === student.familyId) : null;
  const enrollments = db.enrollments
    .filter((e) => e.studentId === student.id)
    .map((e) => ({
      ...e,
      modality: db.modalities.find((m) => m.id === e.modalityId) || null,
      class: e.classId ? (db.classes || []).find((c) => c.id === e.classId) || null : null,
    }));
  return {
    ...student,
    family: family ? { id: family.id, name: family.name } : null,
    enrollments,
  };
}

app.get(['/students', '/api/students'], (req, res) => {
  const enriched = db.students.map(enrichStudent);
  enriched.sort((a, b) => a.name.localeCompare(b.name));
  res.json(enriched);
});

app.get(['/students/:id', '/api/students/:id'], (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Aluno não encontrado.' });
  }
  res.json(enrichStudent(student));
});

app.post(['/students', '/api/students'], (req, res) => {
  const { name, birthDate, phone, address, observation, type, rg, cpf, familyId, modalityIds, enrollments: initialEnrollments } = req.body || {};
  if (!name || !birthDate || !phone) {
    return res.status(400).json({ message: 'Nome, data de nascimento e telefone são obrigatórios.' });
  }

  const age = calculateAge(birthDate);
  const determinedType = type || (age >= 18 ? 'ADULT' : 'CHILD');

  const newStudent = {
    id: generateId('std'),
    name: name.trim(),
    birthDate: new Date(birthDate).toISOString(),
    phone: phone.trim(),
    address: address || null,
    observation: observation || null,
    type: determinedType,
    rg: determinedType === 'ADULT' ? (rg || null) : null,
    cpf: determinedType === 'ADULT' ? (cpf || null) : null,
    familyId: familyId || null,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.students.push(newStudent);

  // Atribuir modalidades informadas na criação
  const itemsToEnroll = Array.isArray(initialEnrollments) && initialEnrollments.length > 0
    ? initialEnrollments
    : (Array.isArray(modalityIds) ? modalityIds.map(mId => ({ modalityId: mId })) : []);

  itemsToEnroll.forEach(item => {
    const mod = db.modalities.find(m => m.id === item.modalityId);
    if (mod) {
      const contractedPrice = Number(mod.monthlyPrice) || 0;
      const pct = Number(item.discountPercentage) || 0;
      const discountAmount = Math.round((contractedPrice * (pct / 100)) * 100) / 100;
      const finalPrice = Math.round((contractedPrice - discountAmount) * 100) / 100;
      const newEnr = {
        id: generateId('enr'),
        studentId: newStudent.id,
        modalityId: mod.id,
        classId: item.classId || null,
        status: 'PENDING_DOCUMENTATION',
        startDate: new Date(item.startDate || Date.now()).toISOString(),
        endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
        contractedPrice,
        discountPercentage: pct,
        discountAmount,
        finalPrice,
        observation: item.observation || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.enrollments.push(newEnr);

      // Gerar recibo inicial de serviço do aluno
      if (!db.documents) db.documents = [];
      db.documents.push({
        id: generateId('doc'),
        studentId: newStudent.id,
        enrollmentId: newEnr.id,
        type: 'RECEIPT',
        title: `Recibo de Prestação de Serviços - ${mod.name}`,
        content: `<h3>RECIBO DE PRESTAÇÃO DE SERVIÇO</h3><p>Declaramos que o(a) aluno(a) <strong>${newStudent.name}</strong> está devidamente matriculado(a) na modalidade <strong>${mod.name}</strong> do centro FitFisio Pilates & Saúde.</p><p>Valor da mensalidade contratada: <strong>R$ ${finalPrice.toFixed(2)}</strong>${pct > 0 ? ` (desconto de ${pct}%)` : ''}.</p><p>Data de início: ${new Date().toLocaleDateString('pt-BR')}</p><br/><br/><p>_____________________________________<br/>FitFisio Pilates & Saúde - Aline Guimarães</p>`,
        status: 'PENDING',
        issueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  saveDb(db);
  res.status(201).json(enrichStudent(newStudent));
});

app.patch(['/students/:id', '/api/students/:id'], (req, res) => {
  const index = db.students.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado.' });
  }
  const s = db.students[index];
  const b = req.body;
  if (b.name !== undefined) s.name = b.name.trim();
  if (b.birthDate !== undefined) s.birthDate = new Date(b.birthDate).toISOString();
  if (b.phone !== undefined) s.phone = b.phone.trim();
  if (b.address !== undefined) s.address = b.address;
  if (b.observation !== undefined) s.observation = b.observation;
  if (b.type !== undefined) s.type = b.type;
  if (b.rg !== undefined) s.rg = s.type === 'ADULT' ? b.rg : null;
  if (b.cpf !== undefined) s.cpf = s.type === 'ADULT' ? b.cpf : null;
  if (b.familyId !== undefined) {
    const oldFamilyId = s.familyId;
    s.familyId = (b.familyId && b.familyId !== 'null' && b.familyId !== 'undefined') ? String(b.familyId).trim() : null;

    // Sincroniza benefício do desconto familiar (10%) com as matrículas ativas
    if (s.familyId && s.familyId !== oldFamilyId) {
      (db.enrollments || []).forEach((e) => {
        if (e.studentId === s.id && e.status !== 'CANCELLED') {
          if (!e.discountPercentage || e.discountPercentage === 0) {
            e.discountPercentage = 10;
            e.discountAmount = (Number(e.contractedPrice) * 10) / 100;
            e.finalPrice = Number(e.contractedPrice) - e.discountAmount;
            e.updatedAt = new Date().toISOString();
          }
        }
      });
    } else if (!s.familyId && oldFamilyId) {
      (db.enrollments || []).forEach((e) => {
        if (e.studentId === s.id && e.status !== 'CANCELLED' && e.discountPercentage === 10) {
          e.discountPercentage = 0;
          e.discountAmount = 0;
          e.finalPrice = Number(e.contractedPrice);
          e.updatedAt = new Date().toISOString();
        }
      });
    }
  }
  s.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichStudent(s));
});

app.patch(['/students/:id/activate', '/api/students/:id/activate'], (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });
  student.active = true;
  student.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichStudent(student));
});

app.patch(['/students/:id/deactivate', '/api/students/:id/deactivate'], (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });
  student.active = false;
  student.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichStudent(student));
});

app.delete(['/students/:id', '/api/students/:id'], (req, res) => {
  const index = db.students.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado.' });
  }
  db.students.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// SETTINGS ROUTES
// -------------------------------------------------------------
app.get(['/settings', '/api/settings'], (req, res) => {
  res.json(db.settings);
});

app.get(['/settings/:key', '/api/settings/:key'], (req, res) => {
  const setting = db.settings.find((s) => s.key === req.params.key);
  if (!setting) {
    return res.status(404).json({ message: 'Configuração não encontrada.' });
  }
  res.json(setting);
});

app.post(['/settings', '/api/settings'], (req, res) => {
  const { key, value, description } = req.body || {};
  if (!key) return res.status(400).json({ message: 'Chave é obrigatória.' });

  const existing = db.settings.find((s) => s.key === key);
  if (existing) {
    return res.status(409).json({ message: 'Já existe uma configuração com essa chave.' });
  }

  const newSetting = {
    id: generateId('set'),
    key,
    value: value || '',
    description: description || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.settings.push(newSetting);
  saveDb(db);
  res.status(201).json(newSetting);
});

app.patch(['/settings/:key', '/api/settings/:key'], (req, res) => {
  const setting = db.settings.find((s) => s.key === req.params.key);
  if (!setting) {
    return res.status(404).json({ message: 'Configuração não encontrada.' });
  }
  if (req.body.value !== undefined) setting.value = req.body.value;
  if (req.body.description !== undefined) setting.description = req.body.description;
  setting.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(setting);
});

app.delete(['/settings/:key', '/api/settings/:key'], (req, res) => {
  const index = db.settings.findIndex((s) => s.key === req.params.key);
  if (index === -1) {
    return res.status(404).json({ message: 'Configuração não encontrada.' });
  }
  db.settings.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// CLASSES ROUTES
// -------------------------------------------------------------
app.get(['/classes', '/api/classes'], (req, res) => {
  const { modalityId } = req.query;
  let list = db.classes || [];
  if (modalityId) {
    list = list.filter((c) => c.modalityId === modalityId);
  }
  const enriched = list.map((c) => {
    const modality = (db.modalities || []).find((m) => m.id === c.modalityId) || null;
    const enrolledCount = (db.enrollments || []).filter(
      (e) => e.classId === c.id && ['ACTIVE', 'AWAITING_APPROVAL', 'PENDING_DOCUMENTATION'].includes(e.status),
    ).length;
    return {
      ...c,
      modality,
      enrolledCount,
    };
  });
  res.json(enriched);
});

app.get(['/classes/:id', '/api/classes/:id'], (req, res) => {
  const c = (db.classes || []).find((item) => item.id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Turma não encontrada.' });
  const modality = (db.modalities || []).find((m) => m.id === c.modalityId) || null;
  const enrolledCount = (db.enrollments || []).filter(
    (e) => e.classId === c.id && ['ACTIVE', 'AWAITING_APPROVAL', 'PENDING_DOCUMENTATION'].includes(e.status),
  ).length;
  res.json({ ...c, modality, enrolledCount });
});

// -------------------------------------------------------------
// DISCOUNTS ROUTES
// -------------------------------------------------------------
app.post(['/discounts/calculate', '/api/discounts/calculate'], (req, res) => {
  const contractedPrice = Number(req.body.contractedPrice) || 0;
  const discountPercentage = Number(req.body.discountPercentage) || 0;

  if (contractedPrice < 0) {
    return res.status(400).json({ message: 'O valor contratado não pode ser negativo.' });
  }
  if (discountPercentage < 0 || discountPercentage > 100) {
    return res.status(400).json({ message: 'O desconto deve estar entre 0% e 100%.' });
  }

  const discountAmount = Math.round((contractedPrice * (discountPercentage / 100)) * 100) / 100;
  const finalPrice = Math.round((contractedPrice - discountAmount) * 100) / 100;

  res.json({
    contractedPrice: Math.round(contractedPrice * 100) / 100,
    discountPercentage: Math.round(discountPercentage * 100) / 100,
    discountAmount,
    finalPrice,
  });
});

// -------------------------------------------------------------
// ENROLLMENTS ROUTES
// -------------------------------------------------------------
function enrichEnrollment(e) {
  const student = (db.students || []).find((s) => s.id === e.studentId) || null;
  const modality = (db.modalities || []).find((m) => m.id === e.modalityId) || null;
  const classItem = e.classId ? (db.classes || []).find((c) => c.id === e.classId) || null : null;
  const documents = (db.documents || []).filter((d) => d.enrollmentId === e.id || (d.studentId === e.studentId && !d.enrollmentId));
  const serviceReceipt = (db.serviceReceipts || []).find((r) => r.enrollmentId === e.id) || null;
  return {
    ...e,
    billingFrequency: (e.billingFrequency === 'BIWEEKLY' || e.billingFrequency === 'QUINZENAL') ? 'BIWEEKLY' : 'MONTHLY',
    student,
    modality,
    class: classItem,
    documents,
    serviceReceipt,
  };
}

app.get(['/enrollments', '/api/enrollments'], (req, res) => {
  let list = db.enrollments || [];
  const { studentId, modalityId, status } = req.query;
  if (studentId) list = list.filter((e) => e.studentId === studentId);
  if (modalityId) list = list.filter((e) => e.modalityId === modalityId);
  if (status) list = list.filter((e) => e.status === status);

  const enriched = list.map(enrichEnrollment);
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

app.get(['/enrollments/:id', '/api/enrollments/:id'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });
  res.json(enrichEnrollment(enrollment));
});

app.post(['/enrollments', '/api/enrollments'], (req, res) => {
  const { studentId, modalityId, classId, startDate, endDate, discountPercentage = 0, observation, billingFrequency = 'MONTHLY' } = req.body || {};

  const student = (db.students || []).find((s) => s.id === studentId);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });

  const modality = (db.modalities || []).find((m) => m.id === modalityId);
  if (!modality) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  if (!modality.active) return res.status(400).json({ message: 'Não é possível realizar matrícula em uma modalidade inativa.' });

  // Validação: Impedir duplicidade de matrícula na mesma modalidade
  const activeStatuses = ['PENDING_DOCUMENTATION', 'AWAITING_APPROVAL', 'ACTIVE', 'SUSPENDED'];
  const existing = (db.enrollments || []).find(
    (e) => e.studentId === studentId && e.modalityId === modalityId && activeStatuses.includes(e.status)
  );
  if (existing) {
    return res.status(409).json({ message: 'O aluno já possui uma matrícula ativa ou em andamento nessa modalidade.' });
  }

  // Validação de turma se informada
  if (classId) {
    const cls = (db.classes || []).find((c) => c.id === classId);
    if (!cls) return res.status(404).json({ message: 'Turma não encontrada.' });
    if (cls.modalityId !== modalityId) {
      return res.status(400).json({ message: 'A turma selecionada não pertence à modalidade da matrícula.' });
    }
  }

  const contractedPrice = Number(modality.monthlyPrice) || 0;
  const pct = Math.max(0, Math.min(100, Number(discountPercentage) || 0));
  const discountAmount = Math.round((contractedPrice * (pct / 100)) * 100) / 100;
  const finalPrice = Math.round((contractedPrice - discountAmount) * 100) / 100;

  const newEnrollment = {
    id: generateId('enr'),
    studentId,
    modalityId,
    classId: classId || null,
    status: 'ACTIVE',
    billingFrequency: (billingFrequency === 'BIWEEKLY' || billingFrequency === 'QUINZENAL') ? 'BIWEEKLY' : 'MONTHLY',
    startDate: new Date(startDate || Date.now()).toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : null,
    approvedAt: new Date().toISOString(),
    contractedPrice,
    discountPercentage: pct,
    discountAmount,
    finalPrice,
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.enrollments.push(newEnrollment);

  // Inicializar ServiceReceipt formal (Contrato / Recibo) para assinatura física
  if (!db.serviceReceipts) db.serviceReceipts = [];
  const initialReceipt = {
    id: generateId('rcp'),
    enrollmentId: newEnrollment.id,
    documentPath: `uploads/documents/receipts/recibo-servico-${newEnrollment.id}.pdf`,
    status: 'PENDING',
    filledAt: new Date().toISOString(),
    approvedAt: null,
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.serviceReceipts.push(initialReceipt);

  // Gerar recibo de prestação de serviços inicial para esta matrícula
  if (!db.documents) db.documents = [];
  db.documents.push({
    id: generateId('doc'),
    studentId,
    enrollmentId: newEnrollment.id,
    type: 'RECEIPT',
    title: `Recibo de Prestação de Serviços - ${modality.name}`,
    content: `<h3>RECIBO DE PRESTAÇÃO DE SERVIÇO</h3><p>Declaramos para os devidos fins que o(a) aluno(a) <strong>${student.name}</strong> celebrou matrícula no curso/modalidade <strong>${modality.name}</strong> junto ao <strong>FitFisio Pilates & Saúde</strong>.</p><p>Valor mensal de tabela: R$ ${contractedPrice.toFixed(2)}<br/>Desconto acordado: ${pct}% (R$ ${discountAmount.toFixed(2)})<br/><strong>Valor final mensal: R$ ${finalPrice.toFixed(2)}</strong></p><p>Data de início: ${new Date(newEnrollment.startDate).toLocaleDateString('pt-BR')}</p><p>Cláusula: As mensalidades possuem vencimento mensal e garantem o acesso aos treinos e acompanhamento profissional especializado.</p><br/><br/><p>_____________________________________<br/>FitFisio Pilates & Saúde - Aline Guimarães</p>`,
    status: 'PENDING',
    issueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  saveDb(db);
  res.status(201).json(enrichEnrollment(newEnrollment));
});

app.patch(['/enrollments/:id', '/api/enrollments/:id'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status === 'CANCELLED' || enrollment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'Não é possível editar uma matrícula cancelada ou concluída.' });
  }

  const { modalityId, classId, startDate, endDate, discountPercentage, observation, billingFrequency } = req.body || {};

  if (billingFrequency !== undefined) {
    enrollment.billingFrequency = (billingFrequency === 'BIWEEKLY' || billingFrequency === 'QUINZENAL') ? 'BIWEEKLY' : 'MONTHLY';
  }

  if (modalityId && modalityId !== enrollment.modalityId) {
    const mod = (db.modalities || []).find((m) => m.id === modalityId);
    if (!mod) return res.status(404).json({ message: 'Modalidade não encontrada.' });
    enrollment.modalityId = modalityId;
    enrollment.contractedPrice = Number(mod.monthlyPrice) || 0;
  }

  if (classId !== undefined) {
    enrollment.classId = classId || null;
  }

  if (startDate) enrollment.startDate = new Date(startDate).toISOString();
  if (endDate !== undefined) enrollment.endDate = endDate ? new Date(endDate).toISOString() : null;
  if (observation !== undefined) enrollment.observation = observation;

  if (discountPercentage !== undefined || modalityId) {
    const pct = discountPercentage !== undefined ? Math.max(0, Math.min(100, Number(discountPercentage) || 0)) : enrollment.discountPercentage;
    enrollment.discountPercentage = pct;
    enrollment.discountAmount = Math.round((enrollment.contractedPrice * (pct / 100)) * 100) / 100;
    enrollment.finalPrice = Math.round((enrollment.contractedPrice - enrollment.discountAmount) * 100) / 100;
  }

  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/request-approval', '/api/enrollments/:id/request-approval'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'PENDING_DOCUMENTATION') {
    return res.status(400).json({ message: 'A matrícula precisa estar pendente de documentação.' });
  }

  enrollment.status = 'AWAITING_APPROVAL';
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/approve', '/api/enrollments/:id/approve'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  enrollment.status = 'ACTIVE';
  enrollment.approvedAt = enrollment.approvedAt || new Date().toISOString();
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/suspend', '/api/enrollments/:id/suspend'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'ACTIVE') {
    return res.status(400).json({ message: 'Somente matrículas ativas podem ser suspensas.' });
  }

  enrollment.status = 'SUSPENDED';
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/reactivate', '/api/enrollments/:id/reactivate'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'SUSPENDED') {
    return res.status(400).json({ message: 'Somente matrículas suspensas podem ser reativadas.' });
  }

  enrollment.status = 'ACTIVE';
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/cancel', '/api/enrollments/:id/cancel'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status === 'CANCELLED' || enrollment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'A matrícula já está encerrada.' });
  }

  enrollment.status = 'CANCELLED';
  enrollment.endDate = enrollment.endDate || new Date().toISOString();
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.delete(['/enrollments/:id', '/api/enrollments/:id'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  enrollment.status = 'CANCELLED';
  enrollment.endDate = enrollment.endDate || new Date().toISOString();
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

// -------------------------------------------------------------
// ENROLLMENT SERVICE RECEIPT (RECIBO SERVICO.pdf)
// -------------------------------------------------------------
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

function mapModalityToDocumentName(originalModalityName) {
  if (!originalModalityName) return 'Pilates';
  const normalized = originalModalityName.trim().toLowerCase();
  if (normalized === 'academia') return 'Pilates';
  if (normalized === 'fisioterapia') return 'Fisioterapia';
  if (normalized === 'hidroginástica' || normalized === 'hidroginastica') return 'Hidroginástica';
  if (normalized === 'hidroterapia') return 'Hidroginástica';
  if (normalized.includes('natação') || normalized.includes('natacao')) return 'Natação';
  if (normalized === 'pilates') return 'Pilates';
  return originalModalityName;
}

function getTableRowYCoordinate(documentServiceName) {
  switch (documentServiceName) {
    case 'Pilates': return 497.5;
    case 'Fisioterapia': return 478.5;
    case 'Natação': return 459.5;
    case 'Hidroginástica': return 440.5;
    default: return 497.5;
  }
}

function resolveServiceReceiptTemplatePath() {
  const candidates = [
    path.join(__dirname, 'backend/assets/documents/RECIBO SERVICO.pdf'),
    path.join(__dirname, 'assets/documents/RECIBO SERVICO.pdf'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Template original RECIBO SERVICO.pdf não encontrado.');
}

function resolveServiceReceiptUploadDir() {
  const uploadDir = path.join(__dirname, 'backend/uploads/documents/receipts');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

function resolveClientDataForReceipt(student) {
  if (!student) return { name: 'Aluno', cpf: '-', phone: '-', address: '-' };
  const isAdult = student.type === 'ADULT';
  if (isAdult) {
    return {
      name: student.name || 'Aluno',
      cpf: student.cpf || '-',
      phone: student.phone || '-',
      address: student.address || '-',
    };
  }
  // Aluno criança: procurar adulto responsável na mesma família
  if (student.familyId) {
    const familyMembers = (db.students || []).filter((s) => s.familyId === student.familyId);
    const adultResponsible = familyMembers.find((m) => m.type === 'ADULT' && m.id !== student.id);
    if (adultResponsible) {
      return {
        name: `${adultResponsible.name} (Resp. p/ ${student.name})`,
        cpf: adultResponsible.cpf || '-',
        phone: adultResponsible.phone || student.phone || '-',
        address: adultResponsible.address || student.address || '-',
      };
    }
  }
  return {
    name: `${student.name} (Menor de idade)`,
    cpf: '-',
    phone: student.phone || '-',
    address: student.address || '-',
  };
}

async function generateEnrollmentReceiptPdf(enrollmentId, options = {}) {
  const enrollment = (db.enrollments || []).find((e) => e.id === enrollmentId);
  if (!enrollment) throw new Error('Matrícula não encontrada.');

  const student = (db.students || []).find((s) => s.id === enrollment.studentId);
  const modality = (db.modalities || []).find((m) => m.id === enrollment.modalityId);
  const classItem = enrollment.classId ? (db.classes || []).find((c) => c.id === enrollment.classId) : null;

  const templatePath = resolveServiceReceiptTemplatePath();
  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.getPage(0);
  const textColor = rgb(0.1, 0.1, 0.1);

  // Prestador
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  page.drawText('34.567.890/0001-12', { x: 412, y: 662, size: 9, font: boldFont, color: textColor });
  page.drawText('Rua Desembargador Trindade, 120 - Centro', { x: 135, y: 638, size: 8.5, font: regularFont, color: textColor });
  page.drawText('(83) 98765-4321', { x: 420, y: 638, size: 9, font: regularFont, color: textColor });
  page.drawText('Campina Grande - PB', { x: 155, y: 620, size: 8.5, font: regularFont, color: textColor });
  page.drawText(dateStr, { x: 408, y: 620, size: 9, font: boldFont, color: textColor });

  // Cliente
  const clientData = resolveClientDataForReceipt(student);
  page.drawText(clientData.name, { x: 175, y: 584, size: 9, font: boldFont, color: textColor });
  page.drawText(clientData.cpf, { x: 138, y: 566, size: 9, font: regularFont, color: textColor });
  page.drawText(clientData.phone, { x: 330, y: 566, size: 9, font: regularFont, color: textColor });
  page.drawText(clientData.address, { x: 135, y: 551, size: 8.5, font: regularFont, color: textColor });

  // Serviços
  const originalModalityName = modality?.name || 'Pilates';
  const documentServiceName = mapModalityToDocumentName(originalModalityName);
  const rowY = getTableRowYCoordinate(documentServiceName);

  const startD = new Date(enrollment.startDate || Date.now());
  const startStr = `${String(startD.getDate()).padStart(2, '0')}/${String(startD.getMonth() + 1).padStart(2, '0')}/${startD.getFullYear()}`;
  const classInfo = classItem?.name ? ` • Turma: ${classItem.name}` : '';
  const desc = `Início: ${startStr}${classInfo}`;

  page.drawText(desc, { x: 175, y: rowY, size: 8.5, font: regularFont, color: textColor });
  const formattedPrice = `R$ ${Number(enrollment.finalPrice || 0).toFixed(2).replace('.', ',')}`;
  page.drawText(formattedPrice, { x: 438, y: rowY, size: 9, font: boldFont, color: textColor });

  // Forma de pagamento
  const method = (options.paymentMethod || 'PIX').toUpperCase();
  const checkboxMap = { PIX: 188.5, DINHEIRO: 212.5, CARTAO: 252.0, TRANSFERENCIA: 286.5, OUTRO: 345.0 };
  const checkX = checkboxMap[method] || 188.5;
  page.drawText('X', { x: checkX, y: 373.5, size: 8.5, font: boldFont, color: textColor });

  // Total
  page.drawText(formattedPrice, { x: 445, y: 373.5, size: 9.5, font: boldFont, color: textColor });

  // Observações
  const obs = options.observation || enrollment.observation || (enrollment.discountPercentage > 0 ? `Desconto aplicado: ${Number(enrollment.discountPercentage).toFixed(0)}% sobre o valor da mensalidade.` : '');
  if (obs) {
    const words = obs.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= 80) cur = (cur + ' ' + w).trim();
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    let obsY = 325;
    for (const line of lines.slice(0, 4)) {
      page.drawText(line, { x: 88, y: obsY, size: 8, font: regularFont, color: textColor });
      obsY -= 15;
    }
  }

  const uploadDir = resolveServiceReceiptUploadDir();
  const fileName = `recibo-servico-${enrollment.id}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);

  const relativePath = path.join('uploads/documents/receipts', fileName);

  if (!db.serviceReceipts) db.serviceReceipts = [];
  let receipt = db.serviceReceipts.find((r) => r.enrollmentId === enrollment.id);
  if (receipt) {
    receipt.documentPath = relativePath;
    receipt.filledAt = new Date().toISOString();
    receipt.observation = obs || null;
    receipt.updatedAt = new Date().toISOString();
  } else {
    receipt = {
      id: generateId('rcp'),
      enrollmentId: enrollment.id,
      documentPath: relativePath,
      status: 'PENDING',
      filledAt: new Date().toISOString(),
      approvedAt: null,
      observation: obs || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.serviceReceipts.push(receipt);
  }
  saveDb(db);

  return {
    receipt,
    filePath,
    relativePath,
    fileName,
    clientData,
    documentServiceName,
    finalPrice: enrollment.finalPrice,
  };
}

// Endpoints do documento da matrícula
app.post(['/enrollments/:id/document/generate', '/api/enrollments/:id/document/generate'], async (req, res) => {
  try {
    const result = await generateEnrollmentReceiptPdf(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    console.error('Erro ao gerar recibo da matrícula:', err);
    res.status(500).json({ message: err.message || 'Erro ao gerar documento.' });
  }
});

app.get(['/enrollments/:id/document', '/api/enrollments/:id/document'], async (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  let receipt = (db.serviceReceipts || []).find((r) => r.enrollmentId === req.params.id);
  const fileName = `recibo-servico-${enrollment.id}.pdf`;
  const uploadDir = resolveServiceReceiptUploadDir();
  const filePath = path.join(uploadDir, fileName);

  if (!receipt || !fs.existsSync(filePath)) {
    try {
      const generated = await generateEnrollmentReceiptPdf(enrollment.id);
      receipt = generated.receipt;
    } catch (err) {
      console.error('Erro na auto-geração do documento:', err);
    }
  }

  res.json({
    receipt,
    filePath,
    fileName,
    documentServiceName: mapModalityToDocumentName((db.modalities || []).find((m) => m.id === enrollment.modalityId)?.name || ''),
    finalPrice: enrollment.finalPrice,
  });
});

app.get(['/enrollments/:id/document/pdf', '/api/enrollments/:id/document/pdf'], async (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  const fileName = `recibo-servico-${enrollment.id}.pdf`;
  const uploadDir = resolveServiceReceiptUploadDir();
  const filePath = path.join(uploadDir, fileName);

  if (!fs.existsSync(filePath)) {
    try {
      await generateEnrollmentReceiptPdf(enrollment.id);
    } catch (err) {
      console.error('Erro ao gerar documento para download:', err);
      return res.status(500).json({ message: 'Não foi possível gerar o PDF do documento.' });
    }
  }

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Content-Length': stat.size,
  });
  fs.createReadStream(filePath).pipe(res);
});

app.patch(['/enrollments/:id/document/status', '/api/enrollments/:id/document/status'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  let receipt = (db.serviceReceipts || []).find((r) => r.enrollmentId === req.params.id);
  if (!receipt) {
    receipt = {
      id: generateId('rcp'),
      enrollmentId: enrollment.id,
      documentPath: `uploads/documents/receipts/recibo-servico-${enrollment.id}.pdf`,
      status: 'PENDING',
      filledAt: new Date().toISOString(),
      approvedAt: null,
      observation: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!db.serviceReceipts) db.serviceReceipts = [];
    db.serviceReceipts.push(receipt);
  }

  const { status, observation, signed } = req.body || {};
  const isMarkingSigned = status === 'APPROVED' || status === 'SIGNED' || signed === true;
  const isMarkingPending = status === 'PENDING' || signed === false;

  if (isMarkingSigned) {
    receipt.status = 'APPROVED';
    receipt.approvedAt = new Date().toISOString();
    // Se a matrícula estava aguardando ou pendente de documentação, ativa formalmente
    if (enrollment.status === 'PENDING_DOCUMENTATION' || enrollment.status === 'AWAITING_APPROVAL') {
      enrollment.status = 'ACTIVE';
      enrollment.approvedAt = enrollment.approvedAt || new Date().toISOString();
      enrollment.updatedAt = new Date().toISOString();
    }
  } else if (isMarkingPending) {
    receipt.status = 'PENDING';
    receipt.approvedAt = null;
  } else if (status) {
    receipt.status = status;
  }

  if (observation !== undefined) {
    receipt.observation = observation;
  }
  receipt.updatedAt = new Date().toISOString();
  saveDb(db);

  res.json(receipt);
});

app.patch(['/enrollments/:id/sign-document', '/api/enrollments/:id/sign-document'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  let receipt = (db.serviceReceipts || []).find((r) => r.enrollmentId === req.params.id);
  if (!receipt) {
    receipt = {
      id: generateId('rcp'),
      enrollmentId: enrollment.id,
      documentPath: `uploads/documents/receipts/recibo-servico-${enrollment.id}.pdf`,
      status: 'PENDING',
      filledAt: new Date().toISOString(),
      approvedAt: null,
      observation: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!db.serviceReceipts) db.serviceReceipts = [];
    db.serviceReceipts.push(receipt);
  }

  const { signed = true } = req.body || {};
  if (signed) {
    receipt.status = 'APPROVED';
    receipt.approvedAt = new Date().toISOString();
    if (enrollment.status === 'PENDING_DOCUMENTATION' || enrollment.status === 'AWAITING_APPROVAL') {
      enrollment.status = 'ACTIVE';
      enrollment.approvedAt = enrollment.approvedAt || new Date().toISOString();
      enrollment.updatedAt = new Date().toISOString();
    }
  } else {
    receipt.status = 'PENDING';
    receipt.approvedAt = null;
  }

  receipt.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json({ success: true, receipt, enrollment: enrichEnrollment(enrollment) });
});

// -------------------------------------------------------------
// DOCUMENTS ROUTES (RECEIPTS & CERTIFICATES)
// -------------------------------------------------------------
function enrichDocument(doc) {
  const student = (db.students || []).find((s) => s.id === doc.studentId) || null;
  const enrollment = doc.enrollmentId ? (db.enrollments || []).find((e) => e.id === doc.enrollmentId) || null : null;
  const modality = enrollment ? (db.modalities || []).find((m) => m.id === enrollment.modalityId) || null : null;
  return {
    ...doc,
    student,
    enrollment: enrollment ? { ...enrollment, modality } : null,
  };
}

app.get(['/documents', '/api/documents'], (req, res) => {
  let list = db.documents || [];
  const { studentId, enrollmentId, type } = req.query;
  if (studentId) list = list.filter((d) => d.studentId === studentId);
  if (enrollmentId) list = list.filter((d) => d.enrollmentId === enrollmentId);
  if (type) list = list.filter((d) => d.type === type);

  const enriched = list.map(enrichDocument);
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

// Endpoint do modelo PDF original em branco do recibo (para visualização e impressão física)
app.get(['/documents/receipt-template', '/api/documents/receipt-template'], (req, res) => {
  try {
    const templatePath = resolveServiceReceiptTemplatePath();
    const stat = fs.statSync(templatePath);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="RECIBO SERVICO.pdf"',
      'Content-Length': stat.size,
    });
    fs.createReadStream(templatePath).pipe(res);
  } catch (err) {
    console.error('Erro ao servir template original de recibo:', err);
    res.status(404).json({ message: 'Arquivo original RECIBO SERVICO.pdf não encontrado.' });
  }
});

app.get(['/documents/:id', '/api/documents/:id'], (req, res) => {
  const doc = (db.documents || []).find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Documento não encontrado.' });
  res.json(enrichDocument(doc));
});

app.post(['/documents', '/api/documents'], (req, res) => {
  const { studentId, enrollmentId, type = 'RECEIPT', title, content, issueDate, expirationDate, observation, status = 'APPROVED' } = req.body || {};

  const student = (db.students || []).find((s) => s.id === studentId);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });

  const newDoc = {
    id: generateId('doc'),
    studentId,
    enrollmentId: enrollmentId || null,
    type, // 'RECEIPT' | 'CERTIFICATE'
    title: title || (type === 'RECEIPT' ? 'Recibo de Prestação de Serviços' : 'Atestado Médico / Declaração'),
    content: content || '',
    status,
    issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
    expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.documents) db.documents = [];
  db.documents.push(newDoc);
  saveDb(db);
  res.status(201).json(enrichDocument(newDoc));
});

app.patch(['/documents/:id', '/api/documents/:id'], (req, res) => {
  const doc = (db.documents || []).find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Documento não encontrado.' });

  const b = req.body || {};
  if (b.title !== undefined) doc.title = b.title;
  if (b.content !== undefined) doc.content = b.content;
  if (b.status !== undefined) doc.status = b.status;
  if (b.issueDate !== undefined) doc.issueDate = b.issueDate ? new Date(b.issueDate).toISOString() : null;
  if (b.expirationDate !== undefined) doc.expirationDate = b.expirationDate ? new Date(b.expirationDate).toISOString() : null;
  if (b.observation !== undefined) doc.observation = b.observation;

  doc.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichDocument(doc));
});

app.delete(['/documents/:id', '/api/documents/:id'], (req, res) => {
  const index = (db.documents || []).findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Documento não encontrado.' });
  db.documents.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// NOTIFICATIONS ROUTES
// -------------------------------------------------------------
app.get(['/notifications', '/api/notifications'], (req, res) => {
  const { userId } = req.query || {};
  let list = db.notifications || [];
  if (userId) {
    list = list.filter((n) => n.userId === userId);
  }
  list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.get(['/notifications/unread/:userId', '/api/notifications/unread/:userId'], (req, res) => {
  const { userId } = req.params;
  const list = (db.notifications || [])
    .filter((n) => n.userId === userId && !n.readAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.get(['/notifications/:id', '/api/notifications/:id'], (req, res) => {
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) return res.status(404).json({ message: 'Notificação não encontrada.' });
  res.json(notif);
});

app.patch(['/notifications/:id/read', '/api/notifications/:id/read'], (req, res) => {
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) return res.status(404).json({ message: 'Notificação não encontrada.' });
  notif.readAt = new Date().toISOString();
  notif.status = 'READ';
  notif.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(notif);
});

app.patch(['/notifications/read-all/:userId', '/api/notifications/read-all/:userId'], (req, res) => {
  const { userId } = req.params;
  let count = 0;
  (db.notifications || []).forEach((n) => {
    if (n.userId === userId && !n.readAt) {
      n.readAt = new Date().toISOString();
      n.status = 'READ';
      n.updatedAt = new Date().toISOString();
      count++;
    }
  });
  saveDb(db);
  res.json({ count });
});

app.post(['/notifications', '/api/notifications'], (req, res) => {
  const { userId, type = 'SYSTEM', channel = 'SYSTEM', title, message, studentId } = req.body || {};
  const newNotif = {
    id: generateId('notif'),
    userId,
    type,
    channel,
    title: title || 'Notificação',
    message: message || '',
    studentId: studentId || null,
    status: 'PENDING',
    readAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.push(newNotif);
  saveDb(db);
  res.status(201).json(newNotif);
});

app.patch(['/notifications/:id', '/api/notifications/:id'], (req, res) => {
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (!notif) return res.status(404).json({ message: 'Notificação não encontrada.' });
  const b = req.body || {};
  if (b.status !== undefined) notif.status = b.status;
  notif.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(notif);
});

function splitFortnightAmounts(modalityPrice, finalPrice) {
  const totalFinalCents = Math.round(finalPrice * 100);
  const firstFinalCents = Math.ceil(totalFinalCents / 2);
  const secondFinalCents = totalFinalCents - firstFinalCents;

  const totalAmountCents = Math.round(modalityPrice * 100);
  const firstAmountCents = Math.ceil(totalAmountCents / 2);
  const secondAmountCents = totalAmountCents - firstAmountCents;

  const firstAmount = firstAmountCents / 100;
  const secondAmount = secondAmountCents / 100;

  const firstFinalAmount = firstFinalCents / 100;
  const secondFinalAmount = secondFinalCents / 100;

  const firstDiscountAmount = Number((firstAmount - firstFinalAmount).toFixed(2));
  const secondDiscountAmount = Number((secondAmount - secondFinalAmount).toFixed(2));

  return {
    first: {
      amount: firstAmount,
      discountAmount: firstDiscountAmount,
      finalAmount: firstFinalAmount,
    },
    second: {
      amount: secondAmount,
      discountAmount: secondDiscountAmount,
      finalAmount: secondFinalAmount,
    },
  };
}

function calculateFortnightDueDates(dueDateStr, referenceMonth, referenceYear) {
  const baseDue = new Date(dueDateStr);
  const year = isNaN(baseDue.getFullYear()) ? referenceYear : baseDue.getFullYear();
  const month = isNaN(baseDue.getMonth()) ? referenceMonth - 1 : baseDue.getMonth();
  const day = isNaN(baseDue.getDate()) ? 10 : baseDue.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let firstDue;
  let secondDue;

  if (day <= 15) {
    firstDue = new Date(year, month, day);
    const secondDay = Math.min(day + 15, daysInMonth);
    secondDue = new Date(year, month, secondDay);
  } else {
    const firstDay = Math.max(1, day - 15);
    firstDue = new Date(year, month, firstDay);
    secondDue = new Date(year, month, Math.min(day, daysInMonth));
  }

  return { firstDue, secondDue };
}

// -------------------------------------------------------------
// PAYMENTS ROUTES
// -------------------------------------------------------------
function enrichPayment(payment) {
  const student = (db.students || []).find((s) => s.id === payment.studentId);
  const enrollment = (db.enrollments || []).find((e) => e.id === payment.enrollmentId);
  let modality = null;
  let cls = null;
  if (enrollment) {
    modality = (db.modalities || []).find((m) => m.id === enrollment.modalityId);
    if (enrollment.classId) {
      cls = (db.classes || []).find((c) => c.id === enrollment.classId);
    }
  }
  return {
    ...payment,
    period: payment.period || 'MONTHLY',
    student: student ? { id: student.id, name: student.name, phone: student.phone, cpf: student.cpf, type: student.type } : null,
    enrollment: enrollment ? {
      ...enrollment,
      billingFrequency: (enrollment.billingFrequency === 'BIWEEKLY' || enrollment.billingFrequency === 'QUINZENAL') ? 'BIWEEKLY' : 'MONTHLY',
      modality: modality ? { id: modality.id, name: modality.name, monthlyPrice: modality.monthlyPrice } : null,
      class: cls ? { id: cls.id, name: cls.name } : null,
    } : null,
  };
}

app.get(['/payments', '/api/payments'], (req, res) => {
  const { studentId, enrollmentId, status, period, referenceMonth, referenceYear } = req.query || {};
  let list = db.payments || [];
  if (studentId) list = list.filter((p) => p.studentId === studentId);
  if (enrollmentId) list = list.filter((p) => p.enrollmentId === enrollmentId);
  if (status) list = list.filter((p) => p.status === status);
  if (period) list = list.filter((p) => (p.period || 'MONTHLY') === period);
  if (referenceMonth !== undefined) list = list.filter((p) => p.referenceMonth === Number(referenceMonth));
  if (referenceYear !== undefined) list = list.filter((p) => p.referenceYear === Number(referenceYear));

  list = [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  res.json(list.map(enrichPayment));
});

app.get(['/payments/overdue', '/api/payments/overdue'], (req, res) => {
  const list = (db.payments || []).filter((p) => p.status === 'OVERDUE');
  res.json(list.map(enrichPayment));
});

app.get(['/payments/student/:studentId/monthly-summary', '/api/payments/student/:studentId/monthly-summary'], (req, res) => {
  const { studentId } = req.params;
  const { referenceMonth, referenceYear } = req.query;
  const m = Number(referenceMonth);
  const y = Number(referenceYear);

  const payments = (db.payments || []).filter(
    (p) => p.studentId === studentId && p.referenceMonth === m && p.referenceYear === y
  );

  const total = payments.reduce((acc, p) => acc + Number(p.finalAmount || 0), 0);
  const paid = payments.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + Number(p.finalAmount || 0), 0);
  const pending = payments.filter((p) => p.status === 'PENDING').reduce((acc, p) => acc + Number(p.finalAmount || 0), 0);
  const overdue = payments.filter((p) => p.status === 'OVERDUE').reduce((acc, p) => acc + Number(p.finalAmount || 0), 0);

  res.json({
    studentId,
    referenceMonth: m,
    referenceYear: y,
    payments: payments.map(enrichPayment),
    total,
    paid,
    pending,
    overdue,
  });
});

app.get(['/payments/:id', '/api/payments/:id'], (req, res) => {
  const payment = (db.payments || []).find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado.' });
  res.json(enrichPayment(payment));
});

app.post(['/payments/student/:studentId/monthly', '/api/payments/student/:studentId/monthly'], (req, res) => {
  const { studentId } = req.params;
  const { referenceMonth, referenceYear, dueDate } = req.body || {};

  const student = (db.students || []).find((s) => s.id === studentId);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });

  const activeEnrollments = (db.enrollments || []).filter(
    (e) => e.studentId === studentId && e.status === 'ACTIVE'
  );

  if (activeEnrollments.length === 0) {
    return res.status(400).json({ message: 'O aluno não possui matrículas ativas.' });
  }

  if (!db.payments) db.payments = [];

  const createdPayments = [];

  for (const enr of activeEnrollments) {
    const modality = (db.modalities || []).find((m) => m.id === enr.modalityId);
    // Modalidade é a fonte da verdade do preço atual
    const modalityPrice = Number(modality?.monthlyPrice !== undefined ? modality.monthlyPrice : (enr.contractedPrice || 0));
    const pct = Math.max(0, Math.min(100, Number(enr.discountPercentage) || 0));
    const totalDiscountAmount = Math.round((modalityPrice * (pct / 100)) * 100) / 100;
    const totalFinalAmount = Math.round((modalityPrice - totalDiscountAmount) * 100) / 100;

    const isBiweekly = enr.billingFrequency === 'BIWEEKLY' || enr.billingFrequency === 'QUINZENAL';

    if (isBiweekly) {
      const split = splitFortnightAmounts(modalityPrice, totalFinalAmount);
      const { firstDue, secondDue } = calculateFortnightDueDates(dueDate, Number(referenceMonth), Number(referenceYear));

      // 1ª Quinzena
      const existingFirst = db.payments.find(
        (p) => p.enrollmentId === enr.id &&
          p.referenceMonth === Number(referenceMonth) &&
          p.referenceYear === Number(referenceYear) &&
          p.period === 'FIRST_FORTNIGHT'
      );
      if (existingFirst) {
        createdPayments.push(existingFirst);
      } else {
        const p1 = {
          id: generateId('pay'),
          studentId: student.id,
          enrollmentId: enr.id,
          referenceMonth: Number(referenceMonth),
          referenceYear: Number(referenceYear),
          period: 'FIRST_FORTNIGHT',
          dueDate: firstDue.toISOString(),
          amount: split.first.amount,
          discountAmount: split.first.discountAmount,
          finalAmount: split.first.finalAmount,
          method: null,
          status: 'PENDING',
          paidAt: null,
          transactionId: null,
          receiptGenerated: false,
          observation: `Mensalidade de ${modality?.name || 'Modalidade'} (1ª quinzena).`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.payments.push(p1);
        createdPayments.push(p1);
      }

      // 2ª Quinzena
      const existingSecond = db.payments.find(
        (p) => p.enrollmentId === enr.id &&
          p.referenceMonth === Number(referenceMonth) &&
          p.referenceYear === Number(referenceYear) &&
          p.period === 'SECOND_FORTNIGHT'
      );
      if (existingSecond) {
        createdPayments.push(existingSecond);
      } else {
        const p2 = {
          id: generateId('pay'),
          studentId: student.id,
          enrollmentId: enr.id,
          referenceMonth: Number(referenceMonth),
          referenceYear: Number(referenceYear),
          period: 'SECOND_FORTNIGHT',
          dueDate: secondDue.toISOString(),
          amount: split.second.amount,
          discountAmount: split.second.discountAmount,
          finalAmount: split.second.finalAmount,
          method: null,
          status: 'PENDING',
          paidAt: null,
          transactionId: null,
          receiptGenerated: false,
          observation: `Mensalidade de ${modality?.name || 'Modalidade'} (2ª quinzena).`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.payments.push(p2);
        createdPayments.push(p2);
      }
    } else {
      // MENSAL
      const existing = db.payments.find(
        (p) => p.enrollmentId === enr.id &&
          p.referenceMonth === Number(referenceMonth) &&
          p.referenceYear === Number(referenceYear) &&
          (p.period === 'MONTHLY' || !p.period)
      );
      if (existing) {
        createdPayments.push(existing);
        continue;
      }

      const newPayment = {
        id: generateId('pay'),
        studentId: student.id,
        enrollmentId: enr.id,
        referenceMonth: Number(referenceMonth),
        referenceYear: Number(referenceYear),
        period: 'MONTHLY',
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        amount: modalityPrice,
        discountAmount: totalDiscountAmount,
        finalAmount: totalFinalAmount,
        method: null,
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        receiptGenerated: false,
        observation: `Mensalidade de ${modality?.name || 'Modalidade'}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.payments.push(newPayment);
      createdPayments.push(newPayment);
    }
  }

  saveDb(db);

  const totalAmount = Math.round(createdPayments.reduce((acc, p) => acc + Number(p.finalAmount || 0), 0) * 100) / 100;

  res.status(201).json({
    studentId: student.id,
    studentName: student.name,
    referenceMonth: Number(referenceMonth),
    referenceYear: Number(referenceYear),
    payments: createdPayments.map(enrichPayment),
    totalAmount,
  });
});

app.post(['/payments', '/api/payments'], (req, res) => {
  const { studentId, enrollmentId, referenceMonth, referenceYear, dueDate, observation, period } = req.body || {};
  if (!enrollmentId) return res.status(400).json({ message: 'A matrícula é obrigatória para criar uma mensalidade.' });

  const enrollment = (db.enrollments || []).find((e) => e.id === enrollmentId);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });
  if (enrollment.studentId !== studentId) return res.status(400).json({ message: 'A matrícula informada não pertence ao aluno.' });

  const modality = (db.modalities || []).find((m) => m.id === enrollment.modalityId);
  const modalityPrice = Number(modality?.monthlyPrice !== undefined ? modality.monthlyPrice : (enrollment.contractedPrice || 0));
  const pct = Math.max(0, Math.min(100, Number(enrollment.discountPercentage) || 0));
  const totalDiscountAmount = Math.round((modalityPrice * (pct / 100)) * 100) / 100;
  const totalFinalAmount = Math.round((modalityPrice - totalDiscountAmount) * 100) / 100;

  const effectivePeriod = period || (
    (enrollment.billingFrequency === 'BIWEEKLY' || enrollment.billingFrequency === 'QUINZENAL')
      ? 'FIRST_FORTNIGHT'
      : 'MONTHLY'
  );

  const existing = (db.payments || []).find(
    (p) => p.enrollmentId === enrollmentId &&
      p.referenceMonth === Number(referenceMonth) &&
      p.referenceYear === Number(referenceYear) &&
      (p.period || 'MONTHLY') === effectivePeriod
  );
  if (existing) {
    return res.status(400).json({ message: 'Já existe uma cobrança para este período desta matrícula neste mês.' });
  }

  let amount = modalityPrice;
  let discountAmount = totalDiscountAmount;
  let finalAmount = totalFinalAmount;
  let defaultObservation = `Mensalidade de ${modality?.name || 'Modalidade'}.`;

  if (effectivePeriod === 'FIRST_FORTNIGHT' || effectivePeriod === 'SECOND_FORTNIGHT') {
    const split = splitFortnightAmounts(modalityPrice, totalFinalAmount);
    const isFirst = effectivePeriod === 'FIRST_FORTNIGHT';
    const part = isFirst ? split.first : split.second;
    amount = part.amount;
    discountAmount = part.discountAmount;
    finalAmount = part.finalAmount;
    defaultObservation = `Mensalidade de ${modality?.name || 'Modalidade'} (${isFirst ? '1ª quinzena' : '2ª quinzena'}).`;
  }

  const newPayment = {
    id: generateId('pay'),
    studentId,
    enrollmentId,
    referenceMonth: Number(referenceMonth),
    referenceYear: Number(referenceYear),
    period: effectivePeriod,
    dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
    amount,
    discountAmount,
    finalAmount,
    method: null,
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    receiptGenerated: false,
    observation: observation || defaultObservation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.payments) db.payments = [];
  db.payments.push(newPayment);
  saveDb(db);
  res.status(201).json(enrichPayment(newPayment));
});

app.patch(['/payments/:id/pay', '/api/payments/:id/pay'], (req, res) => {
  const payment = (db.payments || []).find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado.' });
  if (payment.status === 'PAID') return res.json(enrichPayment(payment));

  const { method, transactionId } = req.body || {};
  if (method === 'CASH' && transactionId) {
    return res.status(400).json({ message: 'Pagamento em dinheiro não possui transactionId.' });
  }

  payment.status = 'PAID';
  payment.method = method || 'CASH';
  payment.transactionId = transactionId || null;
  payment.paidAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichPayment(payment));
});

app.patch(['/payments/:id/confirm-online', '/api/payments/:id/confirm-online'], (req, res) => {
  const payment = (db.payments || []).find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado.' });

  const { method, transactionId } = req.body || {};
  if (method !== 'PIX' && method !== 'CARD') {
    return res.status(400).json({ message: 'Confirmação online apenas para PIX ou Cartão.' });
  }

  payment.status = 'PAID';
  payment.method = method;
  payment.transactionId = transactionId;
  payment.paidAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichPayment(payment));
});

app.patch(['/payments/overdue/update', '/api/payments/overdue/update'], (req, res) => {
  const now = new Date();
  let updated = 0;
  (db.payments || []).forEach((p) => {
    if (p.status === 'PENDING' && new Date(p.dueDate) < now) {
      p.status = 'OVERDUE';
      p.updatedAt = new Date().toISOString();
      updated++;
    }
  });
  saveDb(db);
  res.json({ updated });
});

app.post(['/payments/check-overdue', '/api/payments/check-overdue'], (req, res) => {
  const now = new Date();
  let updatedPayments = 0;
  let notificationsCreated = 0;

  if (!db.notifications) db.notifications = [];

  (db.payments || []).forEach((p) => {
    if (p.status === 'PENDING' && new Date(p.dueDate) < now) {
      p.status = 'OVERDUE';
      p.updatedAt = new Date().toISOString();
      updatedPayments++;

      const student = (db.students || []).find((s) => s.id === p.studentId);
      const studentName = student?.name || 'Aluno';

      const alreadyHas = db.notifications.find(
        (n) => n.studentId === p.studentId && n.type === 'PAYMENT_OVERDUE' && !n.readAt
      );

      if (!alreadyHas) {
        db.notifications.push({
          id: generateId('notif'),
          userId: 'usr-1',
          studentId: p.studentId,
          type: 'PAYMENT_OVERDUE',
          channel: 'SYSTEM',
          title: 'Aluno inadimplente',
          message: `${studentName} possui mensalidade em atraso. É necessário verificar a situação financeira.`,
          status: 'PENDING',
          readAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        notificationsCreated++;
      }
    }
  });

  saveDb(db);
  res.json({ updatedPayments, notificationsCreated });
});

app.patch(['/payments/:id/cancel', '/api/payments/:id/cancel'], (req, res) => {
  const payment = (db.payments || []).find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado.' });
  payment.status = 'CANCELLED';
  payment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichPayment(payment));
});

// -------------------------------------------------------------
// FRONTEND SERVING (DEV & PROD)
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const distPath = path.join(__dirname, 'frontend', 'dist');

  let viteRunning = false;
  if (isDev) {
    try {
      const { createServer } = await import('./frontend/node_modules/vite/dist/node/index.js');
      const vite = await createServer({
        root: path.join(__dirname, 'frontend'),
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      viteRunning = true;
      console.log('✓ Vite middleware initialized successfully in dev mode');
    } catch (err) {
      console.warn('Vite dev middleware could not be loaded, using static files:', err.message);
    }
  }

  if (!viteRunning) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('✓ Serving pre-built frontend from frontend/dist');
    } else {
      console.error('Warning: frontend/dist does not exist! Please run "npm run build"');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitFisio Pilates server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
