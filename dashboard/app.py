import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine

from src.config import DATABASE_URL

FUSO = "America/Recife"
COR_TEMPERATURA = "#eb6834"
COR_FAIXA = "rgba(235, 104, 52, 0.15)"
COR_CHUVA = "#2a78d6"

st.set_page_config(page_title="Clima em Recife", page_icon="🌦️", layout="wide")


@st.cache_data(ttl=600)
def carregar_dados() -> pd.DataFrame:
    """
    Lê a tabela `recife` do Neon (camada já transformada pelo pipeline).
    O resultado fica em cache por 10 minutos, para não consultar o banco
    a cada clique no dashboard.
    """
    engine = create_engine(DATABASE_URL)
    df = pd.read_sql(
        """
        SELECT atualizado_em, data_extracao, temperatura, temperatura_minima,
               temperatura_maxima, chuva_mm, condicao
        FROM recife
        ORDER BY atualizado_em
        """,
        engine,
    )
    engine.dispose()

    # O banco guarda em UTC; o dashboard mostra no horário de Recife.
    for coluna in ("atualizado_em", "data_extracao"):
        df[coluna] = pd.to_datetime(df[coluna], utc=True).dt.tz_convert(FUSO)
    df["condicao"] = df["condicao"].fillna("Sem informação")
    return df


df = carregar_dados()

st.title("Clima em Recife")
st.caption(
    "Fonte: API do Radar Meteorológico (dados Open-Meteo e MET Norway). "
    "Cada ponto é uma leitura coletada pelo pipeline e gravada na tabela "
    "`recife` do Neon. Horários de Recife."
)

if df.empty:
    st.warning(
        "A tabela `recife` ainda está vazia. Rode o pipeline pelo menos uma vez."
    )
    st.stop()

# ---------- Filtros ----------
col_datas, col_condicao = st.columns(2)

dia_min = df["atualizado_em"].dt.date.min()
dia_max = df["atualizado_em"].dt.date.max()
datas = col_datas.date_input(
    "Período",
    (dia_min, dia_max),
    min_value=dia_min,
    max_value=dia_max,
    format="DD/MM/YYYY",
)
# Enquanto o usuário escolhe só a data inicial, o widget devolve 1 data
inicio, fim = datas if len(datas) == 2 else (datas[0], datas[0])

condicoes = sorted(df["condicao"].unique())
escolhidas = col_condicao.multiselect("Condição do tempo", condicoes, default=condicoes)

filtro = df[
    df["atualizado_em"].dt.date.between(inicio, fim) & df["condicao"].isin(escolhidas)
]

if filtro.empty:
    st.warning("Nenhuma leitura para os filtros selecionados.")
    st.stop()

# ---------- Indicadores ----------
ultima = filtro.iloc[-1]
anterior = filtro.iloc[-2] if len(filtro) > 1 else None

st.subheader(
    f"Última leitura: {ultima['atualizado_em']:%d/%m/%Y às %H:%M} · {ultima['condicao']}"
)
c1, c2, c3, c4 = st.columns(4)

delta = None
if (
    anterior is not None
    and pd.notna(ultima["temperatura"])
    and pd.notna(anterior["temperatura"])
):
    delta = f"{ultima['temperatura'] - anterior['temperatura']:+.0f} °C"
c1.metric(
    "Temperatura",
    f"{ultima['temperatura']:.0f} °C" if pd.notna(ultima["temperatura"]) else "—",
    delta=delta,
    delta_color="off",
    help="Variação em relação à leitura anterior",
)
c2.metric("Leituras no período", len(filtro))
c3.metric(
    "Maior máxima no período",
    f"{filtro['temperatura_maxima'].max():.0f} °C",
)
# Leituras sem chuva informada (nulo) ficam fora da média; não contam como 0 mm
c4.metric(
    "Chuva média",
    f"{filtro['chuva_mm'].mean():.1f} mm",
    help=f"{filtro['chuva_mm'].notna().sum()} de {len(filtro)} leituras com chuva informada",
)

# ---------- Gráfico de temperatura ----------
st.markdown("#### Temperatura (°C)")
fig = go.Figure()
fig.add_trace(
    go.Scatter(
        x=filtro["atualizado_em"],
        y=filtro["temperatura_maxima"],
        mode="lines",
        line_width=0,
        showlegend=False,
        name="Máxima do dia",
        hovertemplate="Máx.: %{y:.0f} °C<extra></extra>",
    )
)
fig.add_trace(
    go.Scatter(
        x=filtro["atualizado_em"],
        y=filtro["temperatura_minima"],
        mode="lines",
        line_width=0,
        fill="tonexty",
        fillcolor=COR_FAIXA,
        name="Faixa mínima–máxima",
        hovertemplate="Mín.: %{y:.0f} °C<extra></extra>",
    )
)
fig.add_trace(
    go.Scatter(
        x=filtro["atualizado_em"],
        y=filtro["temperatura"],
        mode="lines+markers",
        line=dict(color=COR_TEMPERATURA, width=2),
        name="Temperatura",
        customdata=filtro[["condicao"]],
        hovertemplate="%{y:.0f} °C · %{customdata[0]}<extra></extra>",
    )
)
fig.update_layout(
    hovermode="x unified",
    xaxis_tickformat="%d/%m",
    xaxis_hoverformat="%d/%m %H:%M",
    yaxis_ticksuffix=" °C",
    legend=dict(orientation="h", y=1.1, x=0, title=None),
    margin=dict(t=30, b=0),
)
st.plotly_chart(fig, width="stretch")

# ---------- Gráfico de chuva ----------
st.markdown("#### Chuva (mm)")
fig_chuva = go.Figure(
    go.Bar(
        x=filtro["atualizado_em"],
        y=filtro["chuva_mm"],
        # As leituras são irregulares no tempo; largura fixa de 8 h (em ms)
        # para a barra não virar um fio no eixo de datas.
        width=8 * 60 * 60 * 1000,
        marker_color=COR_CHUVA,
        hovertemplate="%{x|%d/%m %H:%M}: %{y:.1f} mm<extra></extra>",
    )
)
fig_chuva.update_layout(
    xaxis_tickformat="%d/%m",
    yaxis_ticksuffix=" mm",
    margin=dict(t=10, b=0),
)
st.plotly_chart(fig_chuva, width="stretch")
st.caption("Leituras sem valor informado pela API (nulo) aparecem como lacunas.")

# ---------- Tabela com os dados ----------
with st.expander("Ver leituras em tabela"):
    tabela = filtro.sort_values("atualizado_em", ascending=False).rename(
        columns={
            "atualizado_em": "Leitura",
            "data_extracao": "Extraído em",
            "temperatura": "Temperatura (°C)",
            "temperatura_minima": "Mínima (°C)",
            "temperatura_maxima": "Máxima (°C)",
            "chuva_mm": "Chuva (mm)",
            "condicao": "Condição",
        }
    )
    for coluna in ("Leitura", "Extraído em"):
        tabela[coluna] = tabela[coluna].dt.strftime("%d/%m/%Y %H:%M")
    st.dataframe(tabela, width="stretch", hide_index=True)
