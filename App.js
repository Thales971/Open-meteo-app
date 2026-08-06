import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Keyboard,
  ScrollView,
  Platform,
  ImageBackground,
} from 'react-native';

// Fundos locais (pasta fundos-clima na raiz do projeto)
const FUNDOS = {
  ensolarado: require('./fundos-clima/ensolarado.jpg'),
  parcialmente_nublado: require('./fundos-clima/parcialmente_nublado.jpg'),
  nublado: require('./fundos-clima/nublado.jpg'),
  neblina: require('./fundos-clima/neblina.jpg'),
  chuva: require('./fundos-clima/chuva.jpg'),
  tempestade: require('./fundos-clima/tempestade.jpg'),
  neve: require('./fundos-clima/neve.jpg'),
};

const CIDADES_RAPIDAS = [
  { nome: 'Valinhos', lat: -22.9706, lon: -46.9958 },
  { nome: 'Campinas', lat: -22.9056, lon: -47.0608 },
  { nome: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { nome: 'Curitiba', lat: -25.4284, lon: -49.2733 },
  { nome: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { nome: 'Belo Horizonte', lat: -19.9167, lon: -43.9345 },
  { nome: 'Brasília', lat: -15.7801, lon: -47.9292 },
  { nome: 'Salvador', lat: -12.9714, lon: -38.5014 },
];

export default function App() {
  const [weather, setWeather] = useState([]);
  const [daily, setDaily] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [cidadeNome, setCidadeNome] = useState('São Paulo');
  const [cidadePais, setCidadePais] = useState('Brasil');
  const [latitude, setLatitude] = useState(-23.5505);
  const [longitude, setLongitude] = useState(-46.6333);

  const [searchText, setSearchText] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);
  const [cityResults, setCityResults] = useState([]);

  const [dateFilter, setDateFilter] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  // Abas sem lib de navegação (só useState)
  const [aba, setAba] = useState('detalhes'); // detalhes | horario | diario

  useEffect(() => {
    fetchWeather(latitude, longitude);
  }, [latitude, longitude]);

  // ===================== FETCH DO CLIMA (máximo útil da API) =====================
  const fetchWeather = async (lat, lon) => {
    try {
      setError(null);
      setLoading(true);

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
        `wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,dew_point_2m,` +
        `cloud_cover,precipitation,is_day` +
        `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
        `wind_speed_10m,precipitation_probability,precipitation,cloud_cover` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,` +
        `apparent_temperature_min,precipitation_sum,precipitation_probability_max,` +
        `sunrise,sunset,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max` +
        `&timezone=auto&forecast_days=7`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha na resposta da API');
      }

      const data = await response.json();

      setCurrent({
        ...data.current,
        max: data.daily?.temperature_2m_max?.[0],
        min: data.daily?.temperature_2m_min?.[0],
        precip: data.daily?.precipitation_sum?.[0],
        uv: data.daily?.uv_index_max?.[0],
        sunrise: data.daily?.sunrise?.[0],
        sunset: data.daily?.sunset?.[0],
        precipProb: data.daily?.precipitation_probability_max?.[0],
      });

      const hourly = data.hourly.time.map((time, index) => ({
        id: `h-${index}`,
        time,
        temperature: data.hourly.temperature_2m[index],
        humidity: data.hourly.relative_humidity_2m[index],
        apparent: data.hourly.apparent_temperature[index],
        windSpeed: data.hourly.wind_speed_10m[index],
        precipProb: data.hourly.precipitation_probability?.[index],
        precipitation: data.hourly.precipitation?.[index],
        cloudCover: data.hourly.cloud_cover?.[index],
        code: data.hourly.weather_code[index],
      }));
      setWeather(hourly);

      const dailyList = data.daily.time.map((time, index) => ({
        id: `d-${index}`,
        time,
        code: data.daily.weather_code[index],
        max: data.daily.temperature_2m_max[index],
        min: data.daily.temperature_2m_min[index],
        apparentMax: data.daily.apparent_temperature_max?.[index],
        apparentMin: data.daily.apparent_temperature_min?.[index],
        precip: data.daily.precipitation_sum[index],
        precipProb: data.daily.precipitation_probability_max?.[index],
        sunrise: data.daily.sunrise?.[index],
        sunset: data.daily.sunset?.[index],
        uv: data.daily.uv_index_max?.[index],
        windMax: data.daily.wind_speed_10m_max?.[index],
        gustMax: data.daily.wind_gusts_10m_max?.[index],
      }));
      setDaily(dailyList);
    } catch (err) {
      console.error('Erro ao buscar o clima:', err);
      setError(
        'Não foi possível carregar os dados do clima. Verifique sua conexão com a internet.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================== GEOCODING =====================
  const buscarCidade = async () => {
    const termo = searchText.trim();
    if (!termo) return;

    Keyboard.dismiss();
    setSearchingCity(true);
    setCityResults([]);
    setError(null);

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          termo
        )}&count=6&language=pt&format=json`
      );

      if (!response.ok) throw new Error('Erro na busca de cidade');

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setError(`Nenhuma cidade encontrada para "${termo}". Tente outro nome.`);
        setCityResults([]);
        return;
      }

      setCityResults(data.results);
    } catch (err) {
      console.error('Erro no geocoding:', err);
      setError('Não foi possível buscar a cidade. Verifique sua conexão.');
    } finally {
      setSearchingCity(false);
    }
  };

  const selecionarCidade = (cidade) => {
    const nome =
      cidade.name || cidade.nome || `${cidade.admin1 || ''}`.trim() || 'Cidade';
    const pais = cidade.country || cidade.pais || 'Brasil';

    setCidadeNome(nome);
    setCidadePais(pais);
    setLatitude(cidade.latitude ?? cidade.lat);
    setLongitude(cidade.longitude ?? cidade.lon);
    setSearchText('');
    setCityResults([]);
    setDateFilter('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeather(latitude, longitude);
  };

  // ===================== HELPERS =====================
  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️';
    if (code === 1) return '🌤️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌡️';
  };

  const getFundoPorCodigo = (code) => {
    if (code === 0) return FUNDOS.ensolarado;
    if (code === 1 || code === 2) return FUNDOS.parcialmente_nublado;
    if (code === 3) return FUNDOS.nublado;
    if (code === 45 || code === 48) return FUNDOS.neblina;
    if (code >= 51 && code <= 67) return FUNDOS.chuva;
    if (code >= 80 && code <= 82) return FUNDOS.chuva;
    if (code >= 71 && code <= 77) return FUNDOS.neve;
    if (code >= 95) return FUNDOS.tempestade;
    return FUNDOS.nublado;
  };

  const formatTime = (isoString) => isoString?.split('T')[1]?.slice(0, 5) || '--:--';

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const [datePart] = isoString.split('T');
    const [, month, day] = datePart.split('-');
    const date = new Date(datePart + 'T12:00:00');
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${days[date.getDay()]}, ${day}/${month}`;
  };

  const formatFullDate = (isoString) => {
    if (!isoString) return '';
    const [datePart] = isoString.split('T');
    const [year, month, day] = datePart.split('-');
    const date = new Date(datePart + 'T12:00:00');
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${days[date.getDay()]}, ${day}/${month}/${year}`;
  };

  const direcaoVento = (graus) => {
    if (graus == null) return '--';
    const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    return dirs[Math.round(graus / 45) % 8];
  };

  const filteredWeather = weather.filter((item) => {
    if (!dateFilter.trim()) return true;
    const datePart = item.time.split('T')[0];
    const reversed = datePart.split('-').reverse().join('/');
    return (
      datePart.includes(dateFilter.trim()) ||
      reversed.includes(dateFilter.trim())
    );
  });

  const colors = {
    background: darkMode ? '#0f172a' : '#f0f4f8',
    card: darkMode ? 'rgba(30,41,59,0.92)' : 'rgba(255,255,255,0.92)',
    header: darkMode ? '#38bdf8' : '#1e88e5',
    title: darkMode ? '#e2e8f0' : '#1e293b',
    subtitle: darkMode ? '#94a3b8' : '#64748b',
    text: darkMode ? '#f8fafc' : '#0f172a',
    highlight: darkMode ? '#fbbf24' : '#f59e0b',
    inputBg: darkMode ? 'rgba(51,65,85,0.95)' : 'rgba(226,232,240,0.95)',
    accent: darkMode ? '#34d399' : '#059669',
    chip: darkMode ? 'rgba(51,65,85,0.9)' : 'rgba(224,242,254,0.95)',
    chipText: darkMode ? '#e2e8f0' : '#0369a1',
    overlay: darkMode ? 'rgba(15,23,42,0.55)' : 'rgba(15,23,42,0.25)',
    tabActive: darkMode ? '#38bdf8' : '#1e88e5',
    tabInactive: darkMode ? 'rgba(51,65,85,0.9)' : 'rgba(255,255,255,0.85)',
  };

  const fundoAtual = getFundoPorCodigo(current?.weather_code ?? 3);

  // ===================== RENDER ITEMS =====================
  const renderHourly = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.timeBox}>
        <Text style={[styles.timeText, { color: colors.text }]}>
          {formatTime(item.time)}
        </Text>
        <Text style={[styles.dateText, { color: colors.subtitle }]}>
          {formatDate(item.time)}
        </Text>
      </View>

      <View style={styles.iconBox}>
        <Text style={styles.weatherIcon}>{getWeatherIcon(item.code)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.temperature, { color: colors.highlight }]}>
          {Math.round(item.temperature)}°C
        </Text>
        <Text style={[styles.detailsText, { color: colors.subtitle }]}>
          💧 {item.humidity}% · 💨 {Math.round(item.windSpeed)} km/h
        </Text>
        {item.precipProb != null && (
          <Text style={[styles.detailsText, { color: colors.subtitle }]}>
            ☔ {item.precipProb}% chuva
          </Text>
        )}
      </View>
    </View>
  );

  const renderDaily = ({ item }) => (
    <View style={[styles.dailyCard, { backgroundColor: colors.card }]}>
      <View style={styles.dailyLeft}>
        <Text style={[styles.dailyDate, { color: colors.text }]}>
          {formatDate(item.time)}
        </Text>
        <Text style={styles.dailyIcon}>{getWeatherIcon(item.code)}</Text>
      </View>
      <View style={styles.dailyMid}>
        <Text style={[styles.dailyTemp, { color: colors.highlight }]}>
          {Math.round(item.max)}° / {Math.round(item.min)}°
        </Text>
        <Text style={[styles.detailsText, { color: colors.subtitle }]}>
          ☀️ UV {item.uv != null ? Math.round(item.uv) : '--'}
          {item.precipProb != null ? ` · ☔ ${item.precipProb}%` : ''}
        </Text>
        <Text style={[styles.detailsText, { color: colors.subtitle }]}>
          🌅 {formatTime(item.sunrise)} · 🌇 {formatTime(item.sunset)}
        </Text>
      </View>
      <View style={styles.dailyRight}>
        <Text style={[styles.detailsText, { color: colors.subtitle }]}>
          💨 {item.windMax != null ? Math.round(item.windMax) : '--'}
        </Text>
        <Text style={[styles.detailsText, { color: colors.subtitle }]}>
          km/h
        </Text>
      </View>
    </View>
  );

  const Metric = ({ emoji, label, value }) => (
    <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
      <Text style={styles.metricEmoji}>{emoji}</Text>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.subtitle }]}>{label}</Text>
    </View>
  );

  // ===================== UI =====================
  return (
    <ImageBackground source={fundoAtual} style={styles.bg} resizeMode="cover">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: '#fff' }]}>
              🌤 Previsão do Tempo
            </Text>
            <TouchableOpacity
              style={[styles.themeButton, { backgroundColor: colors.card }]}
              onPress={() => setDarkMode(!darkMode)}
            >
              <Text style={styles.themeButtonText}>{darkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* Busca */}
          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: colors.inputBg, color: colors.text },
              ]}
              placeholder="Buscar cidade (ex: Valinhos, Lisboa...)"
              placeholderTextColor={colors.subtitle}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={buscarCidade}
              returnKeyType="search"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.header }]}
              onPress={buscarCidade}
              disabled={searchingCity}
            >
              {searchingCity ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>🔍</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Resultados geocoding */}
          {cityResults.length > 0 && (
            <View style={[styles.resultsBox, { backgroundColor: colors.card }]}>
              {cityResults.map((c, idx) => (
                <TouchableOpacity
                  key={`${c.id || idx}`}
                  style={styles.resultItem}
                  onPress={() => selecionarCidade(c)}
                >
                  <Text style={[styles.resultName, { color: colors.text }]}>
                    {c.name}
                    {c.admin1 ? `, ${c.admin1}` : ''}
                  </Text>
                  <Text style={[styles.resultCountry, { color: colors.subtitle }]}>
                    {c.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScroll}
            nestedScrollEnabled
          >
            {CIDADES_RAPIDAS.map((c) => (
              <TouchableOpacity
                key={c.nome}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      cidadeNome === c.nome ? colors.header : colors.chip,
                  },
                ]}
                onPress={() => selecionarCidade(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: cidadeNome === c.nome ? '#fff' : colors.chipText,
                    },
                  ]}
                >
                  {c.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Card clima atual */}
          {current && !loading && !error && (
            <View style={[styles.currentCard, { backgroundColor: colors.card }]}>
              <View style={styles.currentIconBox}>
                <Text style={styles.currentIcon}>
                  {getWeatherIcon(current.weather_code)}
                </Text>
              </View>
              <View style={styles.currentInfo}>
                <Text style={[styles.currentTitle, { color: colors.text }]}>
                  {cidadeNome}
                  {cidadePais ? ` · ${cidadePais}` : ''}
                </Text>
                <Text style={[styles.currentTemp, { color: colors.highlight }]}>
                  {Math.round(current.temperature_2m)}°C
                </Text>
                <Text style={[styles.currentDetails, { color: colors.subtitle }]}>
                  Sensação {Math.round(current.apparent_temperature ?? current.temperature_2m)}°C
                </Text>
                <Text style={[styles.currentDetails, { color: colors.subtitle }]}>
                  📈 {current.max != null ? Math.round(current.max) : '--'}° · 📉{' '}
                  {current.min != null ? Math.round(current.min) : '--'}°
                </Text>
                <Text style={[styles.currentDetails, { color: colors.subtitle }]}>
                  📅 {formatFullDate(current.time)}
                </Text>
              </View>
            </View>
          )}

          {/* Abas */}
          {!loading && !error && current && (
            <View style={styles.tabsRow}>
              {[
                { key: 'detalhes', label: 'Detalhes' },
                { key: 'horario', label: 'Por hora' },
                { key: 'diario', label: '7 dias' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor:
                        aba === t.key ? colors.tabActive : colors.tabInactive,
                    },
                  ]}
                  onPress={() => setAba(t.key)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: aba === t.key ? '#fff' : colors.text },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Conteúdo das abas */}
          {loading ? (
            <View style={styles.centerArea}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={[styles.loadingText, { color: '#fff' }]}>
                Carregando previsão de {cidadeNome}...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerArea}>
              <Text style={styles.errorEmoji}>😢</Text>
              <Text style={[styles.errorText, { color: '#fff' }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.header }]}
                onPress={() => fetchWeather(latitude, longitude)}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : aba === 'detalhes' && current ? (
            <ScrollView
              style={styles.listFlex}
              contentContainerStyle={styles.metricsGrid}
              showsVerticalScrollIndicator={Platform.OS === 'web'}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#fff"
                  colors={[colors.header]}
                />
              }
            >
              <Metric
                emoji="💧"
                label="Umidade"
                value={`${current.relative_humidity_2m}%`}
              />
              <Metric
                emoji="🌡️"
                label="Sensação"
                value={`${Math.round(current.apparent_temperature ?? current.temperature_2m)}°C`}
              />
              <Metric
                emoji="💨"
                label="Vento"
                value={`${Math.round(current.wind_speed_10m)} km/h`}
              />
              <Metric
                emoji="🌪️"
                label="Rajadas"
                value={
                  current.wind_gusts_10m != null
                    ? `${Math.round(current.wind_gusts_10m)} km/h`
                    : '--'
                }
              />
              <Metric
                emoji="🧭"
                label="Direção"
                value={direcaoVento(current.wind_direction_10m)}
              />
              <Metric
                emoji="📊"
                label="Pressão"
                value={
                  current.pressure_msl != null
                    ? `${Math.round(current.pressure_msl)} hPa`
                    : '--'
                }
              />
              <Metric
                emoji="💦"
                label="Ponto de orvalho"
                value={
                  current.dew_point_2m != null
                    ? `${Math.round(current.dew_point_2m)}°C`
                    : '--'
                }
              />
              <Metric
                emoji="☁️"
                label="Nuvens"
                value={
                  current.cloud_cover != null ? `${current.cloud_cover}%` : '--'
                }
              />
              <Metric
                emoji="☀️"
                label="Índice UV"
                value={current.uv != null ? `${Math.round(current.uv)}` : '--'}
              />
              <Metric
                emoji="☔"
                label="Chance de chuva"
                value={
                  current.precipProb != null ? `${current.precipProb}%` : '--'
                }
              />
              <Metric
                emoji="🌅"
                label="Nascer do sol"
                value={formatTime(current.sunrise)}
              />
              <Metric
                emoji="🌇"
                label="Pôr do sol"
                value={formatTime(current.sunset)}
              />
            </ScrollView>
          ) : aba === 'horario' ? (
            <>
              <TextInput
                style={[
                  styles.dateFilterInput,
                  { backgroundColor: colors.inputBg, color: colors.text },
                ]}
                placeholder="Filtrar por data (ex: 2026-08-06)"
                placeholderTextColor={colors.subtitle}
                value={dateFilter}
                onChangeText={setDateFilter}
              />
              {filteredWeather.length === 0 ? (
                <View style={styles.centerArea}>
                  <Text style={styles.errorEmoji}>🔍</Text>
                  <Text style={[styles.errorText, { color: '#fff' }]}>
                    Nenhum horário para "{dateFilter.trim()}".
                  </Text>
                </View>
              ) : (
                <FlatList
                  style={styles.listFlex}
                  data={filteredWeather}
                  keyExtractor={(item) => item.id}
                  renderItem={renderHourly}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={Platform.OS === 'web'}
                  keyboardShouldPersistTaps="handled"
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[colors.header]}
                      tintColor="#fff"
                    />
                  }
                />
              )}
            </>
          ) : (
            <FlatList
              style={styles.listFlex}
              data={daily}
              keyExtractor={(item) => item.id}
              renderItem={renderDaily}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={Platform.OS === 'web'}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.header]}
                  tintColor="#fff"
                />
              }
            />
          )}
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonText: {
    fontSize: 20,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  searchButton: {
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  resultsBox: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultCountry: {
    fontSize: 12,
    marginTop: 2,
  },
  chipsScroll: {
    maxHeight: 44,
    marginBottom: 12,
    flexGrow: 0,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  currentCard: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  currentIconBox: {
    marginRight: 14,
  },
  currentIcon: {
    fontSize: 52,
  },
  currentInfo: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 2,
  },
  currentDetails: {
    fontSize: 13,
    marginBottom: 1,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '47%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  dateFilterInput: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  listFlex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  timeBox: {
    width: 78,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  iconBox: {
    width: 56,
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  dailyCard: {
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  dailyLeft: {
    width: 72,
    alignItems: 'center',
  },
  dailyDate: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  dailyIcon: {
    fontSize: 28,
  },
  dailyMid: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dailyTemp: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  dailyRight: {
    width: 56,
    alignItems: 'flex-end',
  },
});
