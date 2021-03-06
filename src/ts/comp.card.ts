import state, { setState } from './state';

import {
  Q,
  QAll,
  requireMappedImageString,
  round,
  delay,
  addEventListenerOnce,
  requireDateChunk
} from './utils';
import { CardDataProps, WeatherResponseMain } from './types';

export async function updateCard(props: CardDataProps) {
  const { type, current, tomorrow, other, index } = props;
  let {
    temp,
    weather,
    humidity,
    dt,
    feels_like,
    wind_speed,
    date_string,
    uvi
  } = current || tomorrow || other || props;
  const { description, main } = weather?.slice(-1)[0] ?? props;

  const weatherImage = requireMappedImageString(
    main as WeatherResponseMain,
    description as string
  );

  switch (type) {
    case 'A': {
      const Body = document.body;
      const Card = Q('.card.type-a') as HTMLElement;
      const FeelsLike = Card.querySelector('.feels-like')!;
      const Uvi = Card.querySelector('.uvi') as HTMLElement;
      const WindSpeed = Card.querySelector('.wind-speed')!;
      const Degree = Card.querySelector('h1')!;
      const Thermometer = Card.querySelector('.thermometer') as HTMLElement;
      const Desc = Card.querySelector('.desc')!;
      const HumidityDeg = Card.querySelector('.humidity-deg')!;

      // addEventListenerOnce
      if (Body.classList.contains('animate-card-overlay')) {
        await delay(400);
        Body.classList.remove('animate-card-overlay');
      }

      const currentHr = new Date(Date.now()).getHours();
      const isNightTime = currentHr >= 19 || currentHr < 7;
      const celsiusVal = round(temp as number);
      const uviVal = round(+uvi!);
      const uviSafety =
        uviVal < 3 ? 'safe' : uviVal < 8 ? 'moderate' : 'not-safe';
      const feel = celsiusVal < 20 ? 'cold' : celsiusVal < 40 ? 'warm' : 'hot';

      if (!isNaN(celsiusVal) && Card) {
        addEventListenerOnce(
          Card,
          () => Body.classList.remove('animate-card-overlay'),
          'animationend'
        );
        await delay(20);
        Body.classList.add('animate-card-overlay');
        await delay(350);

        FeelsLike.textContent = round(+feels_like!) + '°';
        Uvi.textContent = String(uviVal);
        WindSpeed.textContent = round(wind_speed) + ' m/s';
        Degree.textContent = celsiusVal + '°';
        Thermometer.style.minHeight = celsiusVal + '%';
        Desc.textContent = (description![0].toUpperCase() +
          description!.slice(1)) as string;
        HumidityDeg.textContent = round(humidity) + '%';
        Card.className = Card.className.replace(
          /(condition--).*(--0)/,
          `$1${weatherImage}$2`
        );
        (Uvi.parentNode as HTMLElement).style.display = isNightTime
          ? 'none'
          : 'block';
        Uvi.className = Uvi.className.replace(
          /(i--).*(--0)/,
          `$1${uviSafety}$2`
        );
        Thermometer.className = Thermometer.className.replace(
          /(therm--).*(--0)/,
          `$1${feel}$2`
        );
        Card.classList.add('animate');

        if (isNightTime) {
          setState({
            nightMode:
              state.nightMode === undefined ? isNightTime : state.nightMode
          });
        }
      }

      break;
    }
    case 'B': {
      const Card = QAll('.card.type-b')[index ?? 0] as HTMLElement;
      const Day = Card.querySelector('h3')!;
      const Degree = Card.querySelector('p')!;

      if (!isNaN(+temp!) && Card) {
        Day.textContent = date_string ?? 'Monday';
        Degree.textContent = round(temp as number) + '°';
        Card.classList.add('animate');
        Card.className = Card.className.replace(
          /(condition--).*(--0)/,
          `$1${weatherImage}$2`
        );

        Card.onclick = (e: Event) => {
          e.preventDefault();

          if (index! > 0) {
            setState({
              other: { ...state.daily![index as number] },
              activeTabLinkIndex: 2
            });
          } else {
            setState({
              activeTabLinkIndex: 1,
              tomorrow: { ...state.tomorrow! }
            });
          }
        };
      }

      break;
    }
    case 'C': {
      const Card = QAll('.hourly-wrapper')[index ?? 0] as HTMLElement;
      const Hour = Card?.querySelector('.hour')!;
      const Desc = Card?.querySelector('.main')!;
      const Degree = Card?.querySelector('.temp')!;
      const TempMeter = Card?.querySelector('.temp-meter') as HTMLElement;

      const { hour, day } = requireDateChunk(dt, true);
      const degree = round(temp as number);

      if (!isNaN(degree) && Card) {
        Hour.innerHTML = `${hour}<sup>${day}</sup>`;
        Desc.textContent = description || '...';
        Degree.textContent = (degree ?? 0) + '°';
        TempMeter.style.height = `${degree <= 0 || !degree ? 0 : degree}%`;
        TempMeter.className = TempMeter.className.replace(
          /(therm--).*(--0)/,
          `$1${degree < 20 ? 'cold' : degree < 40 ? 'warm' : 'hot'}$2`
        );
        Card.classList.add('animate');
        Card.className = Card.className.replace(
          /(condition--).*(--0)/,
          `$1${weatherImage}$2`
        );
      }

      break;
    }
  }
}
