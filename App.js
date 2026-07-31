import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  SafeAreaView, TextInput, TouchableOpacity, RefreshControl
} from 'react-native';

export default function App() {
  const [weather, setWeather] = useState([]);       // Lista de previsões horárias
  const [current, setCurrent] = useState(null);     // Clima atual (cabeçalho)
  const [loading, setLoading] = useState(true);     // Indicador de carregamento
  const [error, setError] = useState(null);         // Mensagem de erro
  const [darkMode, setDarkMode] = useState(false);  // Tema escuro
  const [searchText, setSearchText] = useState(''); // Campo de pesquisa
  const [refreshing, setRefreshing] = useState(false); // Pull to Refresh

  // Executa uma vez assim que o aplicativo inicia
  useEffect(() => {
    fetchWeather();
  }, []);

  // Busca os dados de previsão do tempo na Open Meteo API (São Paulo)
  const fetchWeather = async () => {
    try {
      setError(null);
      // Faz a requisição na Open Meteo API
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63' +
        '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
        '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
        '&forecast_days=2'
      );
      // Converte o resultado para JSON
      const data = await response.json();

      // Clima atual (usado no cabeçalho)
      setCurrent(data.current);

      // Combina os arrays paralelos da API em uma lista de objetos
      const hourly = data.hourly.time.map((time, index) => ({
        id: index.toString(),
        time: time,                                        // Data/hora ISO
        temperature: data.hourly.temperature_2m[index],    // °C
        humidity: data.hourly.relative_humidity_2m[index], // %
        windSpeed: data.hourly.wind_speed_10m[index],      // km/h
        code: data.hourly.weather_code[index],             // WMO code
      }));
      setWeather(hourly);
    } catch (err) {
      console.error('Erro ao buscar o clima: ', err);
      setError('Não foi possível carregar os dados do clima. Verifique sua conexão com a internet.');
    } finally {
      // Remove o indicador de carregamento
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Função para o Pull to Refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchWeather();
  };

  // Mapeia o código WMO para um emoji de clima
  const getWeatherIcon = (code) => {
    if (code === 0) return '☀️';       // Céu limpo
    if (code === 1) return '🌤️';       // Parcialmente nublado
    if (code === 2) return '⛅';        // Nublado
    if (code === 3) return '☁️';        // Encoberto
    if (code === 45 || code === 48) return '🌫️'; // Nevoeiro
    if (code >= 51 && code <= 57) return '🌦️';   // Garoa
    if (code >= 61 && code <= 67) return '🌧️';   // Chuva
    if (code >= 71 && code <= 77) return '❄️';   // Neve
    if (code >= 80 && code <= 82) return '🌧️';   // Pancadas de chuva
    if (code >= 95) return '⛈️';       // Tempestade
    return '🌡️';                        // Outros
  };

  // Formata a hora a partir do ISO (ex: "2026-07-31T14:00" → "14:00")
  const formatTime = (isoString) => {
    return isoString.split('T')[1].slice(0, 5);
  };

  // Formata a data a partir do ISO (ex: "2026-07-31T14:00" → "Sex, 31/07")
  const formatDate = (isoString) => {
    const [datePart] = isoString.split('T');
    const [, month, day] = datePart.split('-');
    const date = new Date(datePart + 'T12:00:00');
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${days[date.getDay()]}, ${day}/${month}`;
  };

  // Formata a data para exibição completa (ex: "Sex, 31/07/2026")
  const formatFullDate = (isoString) => {
    const [datePart] = isoString.split('T');
    const [year, month, day] = datePart.split('-');
    const date = new Date(datePart + 'T12:00:00');
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${days[date.getDay()]}, ${day}/${month}/${year}`;
  };

  // Filtra a lista pela data digitada no campo de pesquisa
  // (ex: "2026-08-01" ou "01/08" mostram a previsão desse dia)
  const filteredWeather = weather.filter((item) => {
    if (!searchText.trim()) return true;
    const datePart = item.time.split('T')[0]; // "2026-08-01"
    return datePart.includes(searchText.trim()) ||
           datePart.split('-').reverse().join('/').includes(searchText.trim());
  });

  // Paleta de cores conforme o tema (claro/escuro)
  const colors = {
    background: darkMode ? '#121212' : '#f0f4f8',
    card: darkMode ? '#1e1e2e' : '#ffffff',
    header: darkMode ? '#4fc3f7' : '#1e88e5',
    title: darkMode ? '#e0e0e0' : '#333333',
    subtitle: darkMode ? '#9e9e9e' : '#888888',
    text: darkMode ? '#ffffff' : '#000000',
    highlight: darkMode ? '#ffb74d' : '#ff8c00',
    inputBg: darkMode ? '#2a2a3a' : '#e8eef5',
    accent: darkMode ? '#80cbc4' : '#2e8b57',
  };

  const themeStyles = {
    background: { backgroundColor: colors.background },
    card: {
      backgroundColor: colors.card,
      shadowColor: darkMode ? '#000' : '#000',
    },
    headerTitle: { color: colors.header },
    title: { color: colors.title },
    subtitle: { color: colors.subtitle },
    text: { color: colors.text },
    highlight: { color: colors.highlight },
    inputBg: { backgroundColor: colors.inputBg },
    accent: { color: colors.accent },
  };

  // Renderiza cada item da lista (cada hora da previsão)
  const renderItem = ({ item }) => (
    <View style={[styles.card, themeStyles.card]}>
      <View style={styles.timeBox}>
        <Text style={[styles.timeText, themeStyles.text]}>{formatTime(item.time)}</Text>
        <Text style={[styles.dateText, themeStyles.subtitle]}>{formatDate(item.time)}</Text>
      </View>
      <View style={styles.iconBox}>
        <Text style={styles.weatherIcon}>{getWeatherIcon(item.code)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.temperature, themeStyles.highlight]}>{Math.round(item.temperature)}°C</Text>
        <Text style={[styles.detailsText, themeStyles.subtitle]}>
          💧 {item.humidity}%  ·  💨 {item.windSpeed} km/h
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, themeStyles.background]}>
      {/* Cabeçalho */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, themeStyles.headerTitle]}>
          🌤 Previsão do Tempo
        </Text>
        <TouchableOpacity
          style={[styles.themeButton, themeStyles.card]}
          onPress={() => setDarkMode(!darkMode)}
        >
          <Text style={styles.themeButtonText}>{darkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Clima atual (destaque) */}
      {current && (
        <View style={[styles.currentCard, themeStyles.card]}>
          <View style={styles.currentIconBox}>
            <Text style={styles.currentIcon}>{getWeatherIcon(current.weather_code)}</Text>
          </View>
          <View style={styles.currentInfo}>
            <Text style={[styles.currentTitle, themeStyles.text]}>
              Clima agora em São Paulo
            </Text>
            <Text style={[styles.currentTemp, themeStyles.highlight]}>
              {Math.round(current.temperature_2m)}°C
            </Text>
            <Text style={[styles.currentDetails, themeStyles.subtitle]}>
              💧 Umidade: {current.relative_humidity_2m}%
            </Text>
            <Text style={[styles.currentDetails, themeStyles.subtitle]}>
              💨 Vento: {current.wind_speed_10m} km/h
            </Text>
            <Text style={[styles.currentDetails, themeStyles.subtitle]}>
              📅 {formatFullDate(current.time)}
            </Text>
          </View>
        </View>
      )}

      {/* Campo de pesquisa (bônus) */}
      <TextInput
        style={[styles.searchInput, themeStyles.inputBg, themeStyles.text]}
        placeholder="Pesquisar por data (ex: 2026-08-01)"
        placeholderTextColor={colors.subtitle}
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Área principal */}
      {loading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color={colors.header} />
          <Text style={[styles.loadingText, themeStyles.subtitle]}>Carregando previsão...</Text>
        </View>
      ) : error ? (
        // Tratamento de erro de conexão
        <View style={styles.centerArea}>
          <Text style={styles.errorEmoji}>😢</Text>
          <Text style={[styles.errorText, themeStyles.text]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWeather}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredWeather.length === 0 ? (
        <View style={styles.centerArea}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={[styles.errorText, themeStyles.text]}>
            Nenhum resultado para "{(searchText.trim())}".
          </Text>
          <Text style={[styles.loadingText, themeStyles.subtitle]}>
            Tente uma data como 2026-08-01
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
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra para iOS
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // Sombra para Android
    elevation: 3,
  },
  themeButtonText: {
    fontSize: 20,
  },
  currentCard: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    // Sombra para iOS
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // Sombra para Android
    elevation: 4,
  },
  currentIconBox: {
    marginRight: 16,
  },
  currentIcon: {
    fontSize: 56,
  },
  currentInfo: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentTemp: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 4,
  },
  currentDetails: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '500',
  },
  searchInput: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 15,
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
    fontSize: 50,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#1e88e5',
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
    paddingBottom: 20,
  },
  card: {
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    // Sombra para iOS
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    // Sombra para Android
    elevation: 3,
  },
  timeBox: {
    width: 80,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  iconBox: {
    width: 60,
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 30,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
});
