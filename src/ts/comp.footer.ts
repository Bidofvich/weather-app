import state, { setState } from './state';

import { Q, makeInert, requireDateChunk } from './utils';

export default function footer() {
  const Nav = Q('.Nav') as HTMLElement;
  const Main = Q('.Main') as HTMLElement;
  const Container = Q('.Footer .container') as HTMLElement;
  const SideBar = Q('.side-bar') as HTMLElement;
  const SideBarToggler = Q('.side-bar-toggler') as HTMLElement;
  const ThemeToggler = Q('.theme-toggler') as HTMLElement;
  const Install = Container.querySelector('.install') as HTMLElement;

  makeInert(Container, true);

  let deferredPromptForInstall: any;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    console.log('will deferrr!');
    deferredPromptForInstall = e;
  });

  SideBarToggler.addEventListener('click', () => {
    SideBarToggler.classList.toggle('is-open');

    const isOpen = SideBarToggler.classList.contains('is-open');

    SideBar.classList[isOpen ? 'add' : 'remove']('open');
    Container.classList[isOpen ? 'add' : 'remove']('show');
    makeInert(Container, !isOpen);
    makeInert(Nav, isOpen);
    makeInert(Main, isOpen);
    makeInert(Install, true);
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';

    if (deferredPromptForInstall) {
      makeInert(Install, false);

      Install.addEventListener('click', () => {
        deferredPromptForInstall.prompt();
        deferredPromptForInstall.userChoice.then(
          (choiceResult: { outcome: string }) => {
            if (choiceResult.outcome == 'accepted') {
              makeInert(Install, true);
            }

            deferredPromptForInstall = null;
          }
        );
      });
    } else {
      Install.querySelector('span')!.textContent = 'Installed';
    }
  });

  SideBar.addEventListener('click', ({ target }: Event) => {
    if (/^A$/i.test((target as Element).tagName)) {
      SideBarToggler.click();
    }
  });

  Container.addEventListener('click', ({ target }: Event) => {
    if (target === Container) {
      SideBarToggler.click();
    }
  });

  ThemeToggler.addEventListener('click', () => {
    setState({
      nightMode: state.nightMode !== undefined ? !state.nightMode : true
    });
  });
}

export function updateLastSynced(lastSynced: number) {
  const LastSyncedDate = Q('.last-synced-date') as HTMLElement;

  const { date_string, hour, day, date_is_today } = requireDateChunk(
    lastSynced
  );

  if (LastSyncedDate) {
    LastSyncedDate.textContent = `${
      date_is_today ? 'today' : `${day}, ${date_string}`
    } at ${hour}`;
  }
}

export function updateOnlineStatus(isOnline: boolean) {
  const OnlineStatus = Q('.online-status') as HTMLElement;

  if (OnlineStatus) {
    OnlineStatus.classList[!isOnline ? 'add' : 'remove']('offline');
    OnlineStatus.textContent = isOnline ? 'online' : 'offline';
  }
}