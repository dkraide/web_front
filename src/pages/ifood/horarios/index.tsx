import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { ifoodService } from "../../../services/ifoodService";
import { IFoodHorario } from "../../../interfaces/ifood";
import { AuthContext } from "@/contexts/AuthContext";
import CustomButton from "@/components/ui/Buttons";
import styles from "../styles.module.scss";

const DIAS = [
  { key: "MONDAY",    label: "Segunda" },
  { key: "TUESDAY",   label: "Terça" },
  { key: "WEDNESDAY", label: "Quarta" },
  { key: "THURSDAY",  label: "Quinta" },
  { key: "FRIDAY",    label: "Sexta" },
  { key: "SATURDAY",  label: "Sábado" },
  { key: "SUNDAY",    label: "Domingo" },
];

type TurnoLocal = { start: string; duration: number; erro?: string };
type HorariosMap = Record<string, TurnoLocal[]>;

function horasParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutosParaHHMM(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function validarTurnos(turnos: TurnoLocal[]): TurnoLocal[] {
  const sorted = [...turnos].sort((a, b) =>
    horasParaMinutos(a.start) - horasParaMinutos(b.start)
  );
  return sorted.map((t, i) => {
    if (i === 0) return { ...t, erro: undefined };
    const fimAnterior = horasParaMinutos(sorted[i - 1].start) + sorted[i - 1].duration;
    const inicioAtual = horasParaMinutos(t.start);
    return inicioAtual < fimAnterior
      ? { ...t, erro: "Sobrepõe o turno anterior" }
      : { ...t, erro: undefined };
  });
}

export default function IFoodHorariosPage() {
  const router = useRouter();
  const { getUser } = useContext(AuthContext);
  const [empresaId, setEmpresaId] = useState<number>(0);
  const [horariosMap, setHorariosMap] = useState<HorariosMap>({});
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { carregarEmpresaId(); }, []);
  useEffect(() => { if (empresaId > 0) carregarHorarios(); }, [empresaId]);

  async function carregarEmpresaId() {
    const user = await getUser();
    if (user) setEmpresaId(user.empresaSelecionada);
  }

  async function carregarHorarios() {
    setLoading(true);
    try {
      const result = await ifoodService.getHorarios(empresaId);
      if (result.sucesso) {
        const map: HorariosMap = {};
        DIAS.forEach(d => { map[d.key] = []; });
        result.dados.forEach(h => {
          if (!map[h.dayOfWeek]) map[h.dayOfWeek] = [];
          map[h.dayOfWeek].push({
            start: h.start.substring(0, 5), // HH:MM
            duration: h.duration,
          });
        });
        setHorariosMap(map);
      }
    } finally {
      setLoading(false);
    }
  }

  function adicionarTurno(dia: string) {
    setHorariosMap(prev => ({
      ...prev,
      [dia]: validarTurnos([...(prev[dia] ?? []), { start: "09:00", duration: 360 }]),
    }));
  }

  function removerTurno(dia: string, index: number) {
    setHorariosMap(prev => ({
      ...prev,
      [dia]: validarTurnos((prev[dia] ?? []).filter((_, i) => i !== index)),
    }));
  }

  function atualizarTurno(dia: string, index: number, campo: keyof TurnoLocal, valor: string | number) {
    setHorariosMap(prev => {
      const turnos = [...(prev[dia] ?? [])];
      turnos[index] = { ...turnos[index], [campo]: valor };
      return { ...prev, [dia]: validarTurnos(turnos) };
    });
  }

  function temErro(): boolean {
    return Object.values(horariosMap).some(t => t.some(x => x.erro));
  }

  async function salvar() {
    if (temErro()) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const shifts: IFoodHorario[] = [];
      DIAS.forEach(d => {
        (horariosMap[d.key] ?? []).forEach(t => {
          shifts.push({
            id: null,
            dayOfWeek: d.key,
            start: `${t.start}:00`,
            duration: t.duration,
          });
        });
      });

      const result = await ifoodService.atualizarHorarios(empresaId, { shifts });
      if (result.sucesso) {
        setSucesso(true);
        setTimeout(() => setSucesso(false), 3000);
      } else {
        setErro(result.erro);
      }
    } catch {
      setErro("Erro ao salvar horários.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push("/ifood")}>
          <FiArrowLeft size={16} /> Voltar
        </button>
        <h1>Horários de funcionamento</h1>
        <div className={styles.headerActions}>
          {sucesso && <span className={styles.sucessoMsg}>Salvo com sucesso!</span>}
          <CustomButton
            typeButton="main"
            loading={salvando}
            disabled={temErro()}
            onClick={salvar}
          >
            Salvar horários
          </CustomButton>
        </div>
      </div>

      <p className={styles.aviso}>
        Ao salvar, todos os dias não configurados serão considerados fechados.
      </p>

      {loading ? (
        <p className={styles.semDados}>Carregando...</p>
      ) : (
        <div className={styles.diasGrid}>
          {DIAS.map(d => (
            <div key={d.key} className={styles.diaCard}>
              <div className={styles.diaHeader}>
                <span className={styles.diaNome}>{d.label}</span>
                <button
                  className={styles.addTurno}
                  onClick={() => adicionarTurno(d.key)}
                >
                  <FiPlus size={13} /> Turno
                </button>
              </div>

              {(horariosMap[d.key] ?? []).length === 0 ? (
                <p className={styles.fechado}>Fechado</p>
              ) : (
                <div className={styles.turnosList}>
                  {(horariosMap[d.key] ?? []).map((t, i) => (
                    <div key={i} className={`${styles.turnoRow} ${t.erro ? styles.turnoErro : ""}`}>
                      <div className={styles.turnoInputs}>
                        <div className={styles.inputGroup}>
                          <label>Abertura</label>
                          <input
                            type="time"
                            value={t.start}
                            className={styles.timeInput}
                            onChange={e => atualizarTurno(d.key, i, "start", e.target.value)}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label>Duração</label>
                          <select
                            value={t.duration}
                            className={styles.selectInput}
                            onChange={e => atualizarTurno(d.key, i, "duration", Number(e.target.value))}
                          >
                            {[30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720].map(m => (
                              <option key={m} value={m}>
                                {m < 60 ? `${m}min` : `${m / 60}h${m % 60 > 0 ? `${m % 60}min` : ""}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.inputGroup}>
                          <label>Fecha às</label>
                          <span className={styles.fechaAs}>
                            {minutosParaHHMM(horasParaMinutos(t.start) + t.duration)}
                          </span>
                        </div>
                      </div>
                      {t.erro && <p className={styles.erroTurno}>{t.erro}</p>}
                      <button
                        className={styles.removeButton}
                        onClick={() => removerTurno(d.key, i)}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {erro && <span className={styles.erro}>{erro}</span>}
    </div>
  );
}