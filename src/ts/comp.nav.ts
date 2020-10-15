import {
  Q,
  getData,
  render,
  addEventListenerOnce,
  QAll,
  delay,
  task,
  makeInert
} from './utils';
import { CitiesResponse } from './types';
import { getWeatherAndCityDataThenSetState } from './utils';
import { SearchResult } from './templates';

export default function nav() {
  const CityLocation = Q('.Nav .location') as HTMLElement;
  const SearchButton = Q('.search-button') as HTMLElement;
  const SearchInput = Q('.search-input') as HTMLInputElement;
  const SearchResultsOverlay = Q('.search-results-overlay') as HTMLElement;
  const SearchResultsContainer = Q(
    '.search-results-overlay .container'
  ) as HTMLElement;
  const View = Q('.View') as HTMLElement;

  let inputTimeout: any | undefined;

  const searchMessage = (message: string, err?: boolean) => {
    render(
      `<span class='search-result text-center ${
        err ? 'error' : ''
      }'>${message}</span>`,
      SearchResultsContainer
    );
  };

  const callTransitionEndListener = () => {
    addEventListenerOnce(SearchResultsOverlay, handleTransitionEnd);
  };

  const handleTransitionEnd = () => {
    const isHidden = !SearchResultsOverlay.classList.contains('show');

    makeInert(View, !isHidden);
    makeInert(SearchResultsOverlay, isHidden);
    (SearchInput as any).onblur();
    document.body.style.overflow = !isHidden ? 'hidden' : 'auto';
  };

  let _task = () => {};
  let searchIsLoading = false;
  const handleSearchResultClick = (e: any) => {
    e.preventDefault();

    const Result = e.target as HTMLAnchorElement;
    const Type = Result.children[1] as HTMLElement;

    const { latitude, longitude, location, type } = Result.dataset ?? {};

    if (searchIsLoading) {
      Type.textContent = 'busy!🙂';
      delay(1000).then(() => {
        Type.textContent = type as string;
      });
      return;
    } else {
      Type.textContent = 'fetching data...🏃🏽‍♂️';
    }

    _task = () => {
      searchIsLoading = true;

      getWeatherAndCityDataThenSetState(
        Number(latitude),
        Number(longitude),
        location
      )
        .then(async () => {
          searchIsLoading = false;
          Type.textContent = 'done!😎';
          await delay(850);
          Type.textContent = type as string;

          SearchResultsOverlay.classList.remove('show');
          callTransitionEndListener();
          window.history.pushState(
            {},
            '',
            `${window.location.pathname}#${latitude},${longitude}`
          );
        })
        .catch(() => {
          Type.textContent = type as string;
          searchMessage('An error occurred. Failed to get.', true);
        });
    };

    task.assign(_task).execute();
  };

  const handleSearch = (e: any) => {
    if (/Tab|Arrow|Shift|Meta|Control|Alt/i.test(e?.key)) {
      return;
    }

    clearTimeout(inputTimeout);

    if (SearchInput.value.trim()) {
      SearchResultsOverlay.classList.add('show');
      searchMessage('Getting set...😊');

      inputTimeout = setTimeout(async () => {
        searchMessage('Getting matching cities/locations...😉');

        const [latitude, longitude] = SearchInput.value
          .split(',')
          .map(parseFloat) ?? [null, null];
        const areCoords = !isNaN(latitude) && !isNaN(longitude);
        const baseUrl = areCoords
          ? `https://geocode.xyz/${latitude},${longitude}`
          : 'https://geocode.xyz/';
        const queryParam = areCoords
          ? 'json=1'
          : `scantext=${SearchInput.value}&geoit=json`;
        const {
          match,
          matches,
          region,
          standard,
          prov,
          latt,
          longt,
          error
        }: CitiesResponse =
          (await getData(baseUrl, queryParam).catch(() => {
            searchMessage('An error occurred. Failed to get.', true);
          })) ?? {};

        if (matches || region || typeof standard?.city === 'string') {
          render(
            matches
              ? match.map(({ latt, longt, location, matchtype }) =>
                  SearchResult({
                    latitude: Number(latt),
                    longitude: Number(longt),
                    location,
                    type: matchtype
                  })
                )
              : SearchResult({
                  latitude: Number(latt),
                  longitude: Number(longt),
                  location: `${region || standard.city}, ${
                    prov || standard.countryname || standard.prov
                  }`,
                  type: 'city'
                }),
            SearchResultsContainer
          );
          QAll('.search-result').forEach((result) => {
            result.addEventListener('click', handleSearchResultClick, true);
          });
        } else {
          searchMessage(
            `${
              error?.code === '006'
                ? '😕 Something went wrong. Please, try again after some time.'
                : `🤔 Sorry, could not find any matching cities/locations for '${SearchInput.value.replace(
                    /<\/?.*>/,
                    ''
                  )}'. ${
                    areCoords
                      ? ''
                      : 'You may try entering full city/location name/keyword.'
                  }`
            }`
          );
        }
      }, 2000);
    } else {
      searchMessage(
        "Ok, I'm waiting...🙂 <br /><br />PS. You can enter city/location name or (comma-separated) coordinates (latitude, longitude) [e.g. 7.1, 5.3].✌🏼"
      );
    }

    callTransitionEndListener();
  };

  SearchInput.onkeyup = (e: any) => {
    CityLocation.classList.add('hide');
    handleSearch(e);
  };
  SearchInput.onfocus = (e: any) => {
    if (e.target.value) {
      SearchResultsOverlay.classList.add('show');
      callTransitionEndListener();
    }

    SearchInput.classList.add('focused');
    CityLocation.classList.add('hide');
  };
  SearchInput.onblur = () => {
    if (SearchResultsOverlay.classList.contains('show')) {
      return;
    }

    CityLocation.classList.remove('hide');
    setTimeout(() => {
      SearchInput.classList.remove('focused');
    }, 10);
  };

  SearchButton.onclick = () => {
    const hasFocus = SearchInput.classList.contains('focused');

    if (hasFocus) {
      if (SearchInput.value) {
        (SearchInput as any).onkeyup();
        SearchInput.focus();
      } else {
        SearchResultsOverlay.click();
      }
    } else {
      SearchInput.focus();
    }
  };
  SearchResultsOverlay.onclick = (e: any) => {
    if (e.target === SearchResultsOverlay) {
      SearchResultsOverlay.classList.remove('show');
      callTransitionEndListener();
    }
  };
  makeInert(SearchResultsOverlay, true);

  (Q('.search-form') as HTMLElement).onsubmit = (e: any) => e.preventDefault();
}

export const updateLocation = (text: string, err?: boolean) => {
  const CityLocation = Q('.Nav .location') as HTMLElement;

  CityLocation.classList[err ? 'add' : 'remove']('error');
  CityLocation.textContent = text;
};
