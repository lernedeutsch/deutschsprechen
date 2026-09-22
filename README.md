# deutschsprechen

Interaktywna strona do nauki języka niemieckiego z lekcjami A1–B2, ćwiczeniami oraz rozmową z Nele.

## Produkcyjna Nele

Aktywny frontend Nele znajduje się w:

- `nele.html`
- `nele/nele.js`
- `nele/nele-pronunciation.js`

Produkcyjny backend:

- `https://nele-backend.onrender.com`

Nele 3.0 / backend 3 nie jest obecnie backendem produkcyjnym tej strony. Nie należy zmieniać aktywnego frontendu tak, aby łączył się z `nele-backend-3`, bez osobnej decyzji i testów migracyjnych.

Frontend używa jednego klucza tożsamości ucznia:

- `nele_session_id`

Przycisk **Neu anfangen** rozpoczyna nową rozmowę, ale nie powinien wykonywać destrukcyjnego resetu danych ucznia. Przycisk **Als neuer Benutzer starten** tworzy nową lokalną tożsamość ucznia.

## Struktura projektu

```text
/
├── index.html
├── nele.html
├── nele/
│   ├── nele.js
│   └── nele-pronunciation.js
├── lessons/
│   ├── a1/
│   │   ├── index.html
│   │   ├── lektion-1.html
│   │   └── lektion-2.html
│   ├── a2/
│   ├── b1/
│   ├── b2/
│   ├── aktivt-trenieren.a1/
│   ├── sprich-nach.a1/
│   ├── ubungen.a1/
│   ├── dialoge.a1/
│   └── dikatat.a1/
├── data/lessons/
├── tests/
│   ├── browser/site.spec.js
│   ├── project-integrity.js
│   └── nele-safety.js
├── playwright.config.js
└── .github/workflows/nele-ci.yml
```

Nazwy istniejących katalogów `aktivt-trenieren.a1` i `dikatat.a1` są obecnie zachowane ze względu na istniejące linki. Nie należy ich zmieniać pojedynczo bez jednoczesnej aktualizacji wszystkich odwołań i testów.

## Moduły Lektion 1

Główna lekcja A1 prowadzi do pięciu modułów treningowych:

1. Aktiv trainieren
2. Sprich nach
3. Übungen
4. Dialoge
5. Diktat

Przy dodawaniu kolejnych lekcji należy zachować ten sam logiczny układ, o ile dana lekcja korzysta ze wszystkich modułów.

## Testy

Instalacja zależności:

```bash
npm install
npx playwright install chromium
```

Testy przeglądarkowe:

```bash
npm run test:browser
```

Testy Playwright uruchamiają stronę lokalnie i sprawdzają ją w trzech profilach:

- Desktop Chrome
- Android Tablet — 800 × 1280
- Android Phone — 390 × 844

Testy sprawdzają między innymi:

- czy główne strony otwierają się bez błędów przeglądarki,
- czy interfejs Nele jest dostępny,
- czy przyciski Lektion 1 rzeczywiście otwierają Aktiv trainieren, Sprich nach, Übungen, Dialoge i Diktat,
- czy przyciski treningowe nie wychodzą poza szerokość ekranu na desktopie, tablecie i telefonie.

Dodatkowe testy:

```bash
node tests/project-integrity.js
node tests/nele-safety.js
```

`project-integrity.js` kontroluje podstawową strukturę HTML i lokalne odwołania `href/src`.

`nele-safety.js` chroni ważne założenia produkcyjnej Nele, w tym właściwy backend, identyfikator ucznia i zachowanie resetu.

## GitHub Actions

Workflow:

`.github/workflows/nele-ci.yml`

Uruchamia się po pushu i pull requeście do `main`. Sprawdza:

1. składnię JavaScript,
2. integralność projektu,
3. zabezpieczenia Nele,
4. testy Playwright.

Zmiana nie powinna być traktowana jako bezpieczna, jeśli którykolwiek z tych testów nie przechodzi.

## Zasady bezpiecznych zmian

Przy zmianach w projekcie:

- nie zmieniaj produkcyjnego backendu Nele przypadkowo,
- nie wprowadzaj drugiego klucza identyfikującego ucznia,
- nie usuwaj testów bezpieczeństwa tylko po to, aby CI przeszło,
- po zmianie ścieżki pliku aktualizuj wszystkie lokalne linki i testy,
- sprawdzaj układ na desktopie, tablecie i telefonie,
- nowe lekcje buduj według spójnego schematu istniejącej Lektion 1,
- przed zmianą mechanizmu mikrofonu, TTS lub resetu dodaj albo zaktualizuj test chroniący dotychczasowe zachowanie.

## Schemat kolejnych lekcji

Dla głównych lekcji stosuj nazwy:

```text
lessons/a1/lektion-1.html
lessons/a1/lektion-2.html
lessons/a1/lektion-3.html
...
```

Analogicznie dla kolejnych poziomów:

```text
lessons/a2/lektion-1.html
lessons/b1/lektion-1.html
lessons/b2/lektion-1.html
```

Przy rozbudowie modułów treningowych należy zachować przewidywalne nazewnictwo i przed zmianą istniejących katalogów sprawdzić wszystkie odwołania w projekcie.
