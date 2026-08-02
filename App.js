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
} from 'react-native';

// Cidades rápidas (região do usuário + capitais úteis)
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
  // Dados do clima
  const [weather, setWeather] = useState([]); // Lista horária
  const [current, setCurrent] = useState(null); // Clima atual
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cidade selecionada
  const [cidadeNome, setCidadeNome] = useState('São Paulo');
  const [cidadePais, setCidadePais] = useState('Brasil');
  const [latitude, setLatitude] = useState(-23.5505);
  const [longitude, setLongitude] = useState(-46.6333);

  // Busca de cidade
  const [searchText, setSearchText] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);
  const [cityResults, setCityResults] = useState([]);

  // Filtro da lista horária (por data)
  const [dateFilter, setDateFilter] = useState('');

  // Tema
  const [darkMode, setDarkMode] = useState(false);

  // Carrega clima sempre que lat/lon mudam
  useEffect(() => {
    fetchWeather(latitude, longitude);
  }, [latitude, longitude]);

  // ===================== FETCH DO CLIMA =====================
  const fetchWeather = async (lat, lon) => {
    try {
      setError(null);
      setLoading(true);

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature` +
        `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum` +
        `&timezone=auto&forecast_days=3`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha na resposta da API');
      }

      const data = await response.json();

      // Clima atual
      setCurrent({
        ...data.current,
        max: data.daily?.temperature_2m_max?.[0],
        min: data.daily?.temperature_2m_min?.[0],
        precip: data.daily?.precipitation_sum?.[0],
      });

      // Transforma arrays paralelos em lista de objetos (FlatList)
      const hourly = data.hourly.time.map((time, index) => ({
        id: index.toString(),
        time,
        temperature: data.hourly.temperature_2m[index],
        humidity: data.hourly.relative_humidity_2m[index],
        windSpeed: data.hourly.wind_speed_10m[index],
        code: data.hourly.weather_code[index],
      }));

      setWeather(hourly);
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

  // ===================== GEOCODING (busca de cidade) =====================
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

      if (!response.ok) {
        throw new Error('Erro na busca de cidade');
      }

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

  // Seleciona uma cidade (do geocoding ou das rápidas)
  const selecionarCidade = (cidade) => {
    const nome =
      cidade.name || cidade.nome || `${cidade.admin1 || ''}`.trim() || 'Cidade';
    const pais = cidade.country || cidade.pais || 'Brasil';

    setCidadeNome(nome);
    setCidadePais(pais);
    setLatitude(cidade.latitude ?? cidade.lat);
    setLongitude(cidade.longitude ?? cidade.lon);

    // Limpa busca
    setSearchText('');
    setCityResults([]);
    setDateFilter('');
  };

  // Pull to Refresh
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

  const formatTime = (isoString) => isoString.split('T')[1]?.slice(0, 5) || '--:--';

  const formatDate = (isoString) => {
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

  // Filtra a lista horária pela data digitada
  const filteredWeather = weather.filter((item) => {
    if (!dateFilter.trim()) return true;
    const datePart = item.time.split('T')[0];
    const reversed = datePart.split('-').reverse().join('/');
    return (
      datePart.includes(dateFilter.trim()) ||
      reversed.includes(dateFilter.trim())
    );
  });

  // Cores do tema
  const colors = {
    background: darkMode ? '#0f172a' : '#f0f4f8',
    card: darkMode ? '#1e293b' : '#ffffff',
    header: darkMode ? '#38bdf8' : '#1e88e5',
    title: darkMode ? '#e2e8f0' : '#1e293b',
    subtitle: darkMode ? '#94a3b8' : '#64748b',
    text: darkMode ? '#f8fafc' : '#0f172a',
    highlight: darkMode ? '#fbbf24' : '#f59e0b',
    inputBg: darkMode ? '#334155' : '#e2e8f0',
    accent: darkMode ? '#34d399' : '#059669',
    chip: darkMode ? '#334155' : '#e0f2fe',
    chipText: darkMode ? '#e2e8f0' : '#0369a1',
  };

  // ===================== RENDER ITEM (FlatList) =====================
  const renderItem = ({ item }) => (
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
          💧 {item.humidity}%  ·  💨 {Math.round(item.windSpeed)} km/h
        </Text>
      </View>
    </View>
  );

  // ===================== UI =====================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.header }]}>
          🌤 Previsão do Tempo
        </Text>
        <TouchableOpacity
          style={[styles.themeButton, { backgroundColor: colors.card }]}
          onPress={() => setDarkMode(!darkMode)}
        >
          <Text style={styles.themeButtonText}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Busca de cidade */}
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

      {/* Resultados do geocoding */}
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

      {/* Chips de cidades rápidas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chipsScroll}
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

      {/* Card do clima atual */}
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
              Sensação: {Math.round(current.apparent_temperature || current.temperature_2m)}°C
            </Text>
            <Text style={[styles.currentDetails, { color: colors.subtitle }]}>
              💧 {current.relative_humidity_2m}%  ·  💨 {Math.round(current.wind_speed_10m)} km/h
            </Text>
            {(current.max != null || current.min != null) && (
              <Text style={[styles.currentDetails, { color: colors.subtitle }]}>
                📈 Máx {Math.round(current.max)}°  ·  📉 Mín {Math.round(current.min)}°
              </Text>
            )}
            <Text style={[styles.currentDetails, { color: colors.subtitle }]}>
              📅 {formatFullDate(current.time)}
            </Text>
          </View>
        </View>
      )}

      {/* Filtro por data na lista horária */}
      {!loading && !error && weather.length > 0 && (
        <TextInput
          style={[
            styles.dateFilterInput,
            { backgroundColor: colors.inputBg, color: colors.text },
          ]}
          placeholder="Filtrar horário por data (ex: 2026-08-03)"
          placeholderTextColor={colors.subtitle}
          value={dateFilter}
          onChangeText={setDateFilter}
        />
      )}

      {/* Área principal */}
      {loading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color={colors.header} />
          <Text style={[styles.loadingText, { color: colors.subtitle }]}>
            Carregando previsão de {cidadeNome}...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerArea}>
          <Text style={styles.errorEmoji}>😢</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.header }]}
            onPress={() => fetchWeather(latitude, longitude)}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredWeather.length === 0 ? (
        <View style={styles.centerArea}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Nenhum horário encontrado para "{dateFilter.trim()}".
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWeather}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.header]}
              tintColor={colors.header}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
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
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    elevation: 4,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 2,
  },
  currentDetails: {
    fontSize: 13,
    marginBottom: 1,
    fontWeight: '500',
  },
  dateFilterInput: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
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
});
