# Fundos de clima

Imagens de fundo para o app, organizadas por tipo de tempo.

O Lucas pode usar essas imagens como background com opacidade/transparência no React Native (`ImageBackground` + estilo com `opacity`).

## Arquivos esperados

| Arquivo | Situação | Código Open-Meteo (aproximado) |
|---------|----------|--------------------------------|
| `ensolarado.jpg` | Céu limpo / sol | 0 |
| `parcialmente_nublado.jpg` | Parcialmente nublado | 1, 2 |
| `nublado.jpg` | Nublado / encoberto | 3 |
| `neblina.jpg` | Neblina / névoa | 45, 48 |
| `chuva.jpg` | Chuva | 51–67, 80–82 |
| `tempestade.jpg` | Tempestade / trovoada | 95+ |
| `neve.jpg` | Neve | 71–77 |

## Como usar depois (sugestão)

```jsx
import { ImageBackground } from 'react-native';

// mapear weather_code -> arquivo
const fundo = getFundoPorCodigo(current.weather_code);

<ImageBackground
  source={fundo}
  style={{ flex: 1 }}
  imageStyle={{ opacity: 0.35 }} // transparência
>
  {/* UI do app */}
</ImageBackground>
```

As imagens foram geradas para servir de base. Podem ser trocadas ou ajustadas.
