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
  useWindowDimensions,
} from 'react-native';

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

const glassStyle = (dark) => ({
  backgroundColor: dark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.3)',
  borderWidth: 1,
  borderColor: dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255, 255, 255, 0.45)',
  ...(Platform.OS === 'web'
    ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
    : {}),
});

// esconde a barrinha feia no web, mas a rodinha continua funcionando
const hideScrollbar = Platform.OS === 'web'
  ? {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      overflowY: 'auto',
      overflowX: 'hidden',
    }
  : {};

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

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
  // detalhes | horario | diario | sobre
  const [aba, setAba] = useState('detalhes');

  useEffect(() => {
    fetchWeather(latitude, longitude);
  }, [latitude, longitude]);

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
      if (!response.ok) throw new Error('Falha na resposta da API');

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

  const getFundoPorCodigo = (code, isDay = 1) => {
    const noite = isDay === 0;
    if (code === 0) return noite ? FUNDOS.neblina : FUNDOS.ensolarado;
    if (code === 1 || code === 2) {
      return noite ? FUNDOS.nublado : FUNDOS.parcialmente_nublado;
    }
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
    header: darkMode ? '#38bdf8' : '#1e88e5',
    subtitle: darkMode ? '#94a3b8' : '#475569',
    text: darkMode ? '#f8fafc' : '#0f172a',
    highlight: darkMode ? '#fbbf24' : '#ea580c',
    chipText: darkMode ? '#e2e8f0' : '#0f172a',
    overlay: darkMode ? 'rgba(15,23,42,0.45)' : 'rgba(15,23,42,0.18)',
    tabActive: darkMode ? '#38bdf8' : '#1e88e5',
    navBg: darkMode ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.88)',
  };

  const glass = glassStyle(darkMode);
  const fundoAtual = getFundoPorCodigo(
    current?.weather_code ?? 3,
    current?.is_day ?? 1
  );
  const metricWidth = isWide ? '23%' : width < 360 ? '100%' : '47%';

  const renderHourly = ({ item }) => (
    <View style={[styles.card, glass]}>
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
    <View style={[styles.dailyCard, glass]}>
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
        <Text style={[styles.detailsText, { color: colors.subtitle }]}>km/h</Text>
      </View>
    </View>
  );

  const Metric = ({ emoji, label, value }) => (
    <View style={[styles.metricCard, glass, { width: metricWidth }]}>
      <Text style={styles.metricEmoji}>{emoji}</Text>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.subtitle }]}>{label}</Text>
    </View>
  );

  // Scroll com rodinha no web (sem barra lateral feia) + FlatList no mobile
  const HourlyList = () => {
    if (Platform.OS === 'web') {
      return (
        <ScrollView
          style={[styles.listFlex, hideScrollbar]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredWeather.map((item) => (
            <View key={item.id}>{renderHourly({ item })}</View>
          ))}
        </ScrollView>
      );
    }
    return (
      <FlatList
        style={styles.listFlex}
        data={filteredWeather}
        keyExtractor={(item) => item.id}
        renderItem={renderHourly}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.header]}
            tintColor="#fff"
          />
        }
      />
    );
  };

  const DailyList = () => {
    if (Platform.OS === 'web') {
      return (
        <ScrollView
          style={[styles.listFlex, hideScrollbar]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {daily.map((item) => (
            <View key={item.id}>{renderDaily({ item })}</View>
          ))}
        </ScrollView>
      );
    }
    return (
      <FlatList
        style={styles.listFlex}
        data={daily}
        keyExtractor={(item) => item.id}
        renderItem={renderDaily}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.header]}
            tintColor="#fff"
          />
        }
      />
    );
  };

  const navItems = [
    { key: 'detalhes', icon: '📊', label: 'Detalhes' },
    { key: 'horario', icon: '🕐', label: 'Por hora' },
    { key: 'diario', icon: '📅', label: '7 dias' },
    { key: 'sobre', icon: 'ℹ️', label: 'Sobre' },
  ];

  return (
    <ImageBackground source={fundoAtual} style={styles.bg} resizeMode="cover">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <SafeAreaView style={styles.container}>
          <View style={[styles.inner, isWide && styles.innerWide]}>
            {/* Cabeçalho */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>🌤 Previsão do Tempo</Text>
              <TouchableOpacity
                style={[styles.themeButton, glass]}
                onPress={() => setDarkMode(!darkMode)}
              >
                <Text style={styles.themeButtonText}>{darkMode ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </View>

            {/* Busca — esconde na aba Sobre */}
            {aba !== 'sobre' && (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.searchInput, glass, { color: colors.text }]}
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

                {cityResults.length > 0 && (
                  <View style={[styles.resultsBox, glass]}>
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
                        glass,
                        cidadeNome === c.nome && {
                          backgroundColor: colors.header,
                          borderColor: colors.header,
                        },
                      ]}
                      onPress={() => selecionarCidade(c)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              cidadeNome === c.nome ? '#fff' : colors.chipText,
                          },
                        ]}
                      >
                        {c.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {current && !loading && !error && (
                  <View style={[styles.currentCard, glass]}>
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
                        Sensação{' '}
                        {Math.round(
                          current.apparent_temperature ?? current.temperature_2m
                        )}
                        °C
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
              </>
            )}

            {/* Conteúdo da aba */}
            <View style={styles.contentArea}>
              {loading && aba !== 'sobre' ? (
                <View style={styles.centerArea}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>
                    Carregando previsão de {cidadeNome}...
                  </Text>
                </View>
              ) : error && aba !== 'sobre' ? (
                <View style={styles.centerArea}>
                  <Text style={styles.errorEmoji}>😢</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: colors.header }]}
                    onPress={() => fetchWeather(latitude, longitude)}
                  >
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : aba === 'detalhes' && current ? (
                <ScrollView
                  style={[styles.listFlex, hideScrollbar]}
                  contentContainerStyle={styles.metricsGrid}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Metric emoji="💧" label="Umidade" value={`${current.relative_humidity_2m}%`} />
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
                  <Metric emoji="🧭" label="Direção" value={direcaoVento(current.wind_direction_10m)} />
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
                    value={current.cloud_cover != null ? `${current.cloud_cover}%` : '--'}
                  />
                  <Metric
                    emoji="☀️"
                    label="Índice UV"
                    value={current.uv != null ? `${Math.round(current.uv)}` : '--'}
                  />
                  <Metric
                    emoji="☔"
                    label="Chance de chuva"
                    value={current.precipProb != null ? `${current.precipProb}%` : '--'}
                  />
                  <Metric emoji="🌅" label="Nascer do sol" value={formatTime(current.sunrise)} />
                  <Metric emoji="🌇" label="Pôr do sol" value={formatTime(current.sunset)} />
                </ScrollView>
              ) : aba === 'horario' ? (
                <>
                  <TextInput
                    style={[styles.dateFilterInput, glass, { color: colors.text }]}
                    placeholder="Filtrar por data (ex: 2026-08-06)"
                    placeholderTextColor={colors.subtitle}
                    value={dateFilter}
                    onChangeText={setDateFilter}
                  />
                  {filteredWeather.length === 0 ? (
                    <View style={styles.centerArea}>
                      <Text style={styles.errorEmoji}>🔍</Text>
                      <Text style={styles.errorText}>
                        Nenhum horário para "{dateFilter.trim()}".
                      </Text>
                    </View>
                  ) : (
                    <HourlyList />
                  )}
                </>
              ) : aba === 'diario' ? (
                <DailyList />
              ) : (
                /* ========== PÁGINA SOBRE ========== */
                <ScrollView
                  style={[styles.listFlex, hideScrollbar]}
                  contentContainerStyle={styles.aboutContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={[styles.aboutCard, glass]}>
                    <Text style={styles.aboutEmoji}>🌤</Text>
                    <Text style={[styles.aboutTitle, { color: colors.text }]}>
                      Previsão do Tempo
                    </Text>
                    <Text style={[styles.aboutText, { color: colors.subtitle }]}>
                      App de clima feito em React Native (Expo) para a atividade prática de
                      consumo de API REST. Busca dados em tempo real da Open-Meteo e mostra
                      temperatura, umidade, vento, UV, nascer/pôr do sol e previsões por hora
                      e por dia.
                    </Text>
                  </View>

                  <View style={[styles.aboutCard, glass]}>
                    <Text style={[styles.aboutSection, { color: colors.text }]}>
                      O que você encontra aqui
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Clima atual da cidade escolhida
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Detalhes: umidade, pressão, ponto de orvalho, UV...
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Previsão hora a hora
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Previsão dos próximos 7 dias
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Busca de qualquer cidade do mundo
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Fundo que muda conforme o tempo
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • Tema claro e escuro
                    </Text>
                  </View>

                  <View style={[styles.aboutCard, glass]}>
                    <Text style={[styles.aboutSection, { color: colors.text }]}>
                      Tecnologias
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • React Native + Expo
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • fetch + async/await
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • FlatList / ScrollView
                    </Text>
                    <Text style={[styles.aboutBullet, { color: colors.subtitle }]}>
                      • API Open-Meteo (gratuita, sem chave)
                    </Text>
                  </View>

                  <View style={[styles.aboutCard, glass]}>
                    <Text style={[styles.aboutSection, { color: colors.text }]}>
                      Atividade
                    </Text>
                    <Text style={[styles.aboutText, { color: colors.subtitle }]}>
                      Projeto da disciplina de Desenvolvimento de Sistemas — consumo de API
                      REST em React Native. SENAI / SESI.
                    </Text>
                  </View>

                  <Text style={styles.copyright}>© Thales Dev</Text>
                </ScrollView>
              )}
            </View>

            {/* ========== NAV EMBAIXO ========== */}
            <View style={[styles.bottomNav, { backgroundColor: colors.navBg }, glass]}>
              {navItems.map((item) => {
                const ativo = aba === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.navItem}
                    onPress={() => setAba(item.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.navIcon, ativo && { opacity: 1 }]}>
                      {item.icon}
                    </Text>
                    <Text
                      style={[
                        styles.navLabel,
                        {
                          color: ativo ? colors.tabActive : colors.subtitle,
                          fontWeight: ativo ? '800' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 16 : 40,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  innerWide: {
    paddingHorizontal: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonText: {
    fontSize: 18,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  searchButton: {
    width: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  resultsBox: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultItem: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
    maxHeight: 42,
    marginBottom: 10,
    flexGrow: 0,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  currentCard: {
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  currentIconBox: {
    marginRight: 12,
  },
  currentIcon: {
    fontSize: 48,
  },
  currentInfo: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentTemp: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 2,
  },
  currentDetails: {
    fontSize: 12,
    marginBottom: 1,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    minHeight: 0, // importante pro scroll no web
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    borderRadius: 16,
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
    marginBottom: 8,
    borderRadius: 14,
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
    color: '#fff',
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
    color: '#fff',
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
    minHeight: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 16,
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
    borderRadius: 16,
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
  // Sobre
  aboutContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  aboutCard: {
    borderRadius: 18,
    padding: 18,
  },
  aboutEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  aboutSection: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  aboutBullet: {
    fontSize: 14,
    lineHeight: 24,
  },
  copyright: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  // Nav inferior
  bottomNav: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 10 : 14,
    paddingHorizontal: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginHorizontal: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.85,
  },
  navLabel: {
    fontSize: 11,
  },
});
