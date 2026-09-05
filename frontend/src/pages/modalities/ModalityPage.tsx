import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  modalitiesService,
  type Modality,
} from '../../services/modalities.service';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ModalityPage() {
  const { slug } = useParams<{ slug: string }>();

  const [modality, setModality] = useState<Modality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadModality() {
      try {
        setLoading(true);
        setError('');

        const modalities = await modalitiesService.findAll();

        const found = modalities.find(
          (item) => slugify(item.name) === slug,
        );

        if (!found) {
          setError('Modalidade não encontrada.');
          return;
        }

        setModality(found);
      } catch {
        setError('Não foi possível carregar a modalidade.');
      } finally {
        setLoading(false);
      }
    }

    loadModality();
  }, [slug]);

  if (loading) {
    return (
      <div>
        <h1>Carregando...</h1>
      </div>
    );
  }

  if (error || !modality) {
    return (
      <div>
        <h1>Modalidade</h1>
        <p>{error || 'Modalidade não encontrada.'}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>{modality.name}</h1>

      <p>
        {modality.description || 'Nenhuma descrição cadastrada.'}
      </p>

      <div>
        <strong>Valor mensal:</strong>{' '}
        R$ {Number(modality.monthlyPrice).toFixed(2)}
      </div>

      <div>
        <strong>Status:</strong>{' '}
        {modality.active ? 'Ativa' : 'Inativa'}
      </div>

      <div>
        <strong>Utiliza turmas:</strong>{' '}
        {modality.requiresClass ? 'Sim' : 'Não'}
      </div>

      {modality.requiresClass && modality.capacity !== null && (
        <div>
          <strong>Capacidade por turma:</strong>{' '}
          {modality.capacity} alunos
        </div>
      )}

      <section>
        <h2>Turmas</h2>

        {modality.requiresClass ? (
          <p>
            As turmas desta modalidade serão exibidas e gerenciadas
            aqui.
          </p>
        ) : (
          <p>
            Esta modalidade não utiliza turmas.
          </p>
        )}
      </section>
    </div>
  );
}