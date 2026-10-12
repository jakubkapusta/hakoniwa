# Hakoniwa (箱庭)

> Składasz kartonową dioramę jak japoński zestaw modelarski. Kiedy kładziesz ostatni kawałek, robi się wieczór i miniatura ożywa.

**Mieszanka:** zestaw modelarski z papieru (jak japońskie Sankei Miniatuart) × spokojne puzzle × kolekcja miniatur
**Status:** M1 i M2 zrobione (2026-10-12), czekamy na test właściciela.
**Prototyp:** `~/code/plany/hakoniwa/prototyp/` (jeden plik, punkt wyjścia dla tej gry).

*Hakoniwa* to po japońsku „ogród w pudełku”, czyli miniaturowy krajobraz, który się układa i podziwia.

---

## Ustalenia

| Temat | Decyzja |
|---|---|
| Charakter | **Odprężająca rozrywka, nie gra z wyzwaniem.** Bez porażki, bez licznika czasu, bez gwiazdek. |
| Styl | **Urocza, malowana grafika inspirowana Ghibli, w klimacie Japonii.** Ciepłe kolory, miękkie światło, dużo drobnych, codziennych szczegółów. |
| Zawartość | **Kilka scenek do złożenia**, każda to osobna diorama z innym miejscem w Japonii. |
| Warstwy czy kawałki | **Hybryda, opis niżej.** Scena powstaje etapami od tła do detali, jak w instrukcji zestawu. W każdym etapie przenosi się kawałki z arkusza. |
| Grafika | **Tylko proceduralnie** (decyzja 2026-10-12): wszystko malowane w kodzie, zero plików graficznych, jak w Roju i Fali. |
| Zakres pierwszej sesji | **M1 i szkielet M2:** Yatai na serio, półka z pudełkami i druga scenka (przystanek w deszczu). |
| Dodatki w M1 | **Dźwięk warstwami i ukryty smaczek.** Wypychanie z arkusza i tryb mistrza na później. |
| Platforma | Jak w pozostałych grach: telefon trzymany pionowo, a do tego laptop. |
| Szczegóły | Mechanikę, parametry i technikę dobiera wykonawca. Plan wyznacza kierunek. |
| Język | Tekst dla gracza po polsku, japońskie napisy jako ozdoba. Kod po angielsku, commity po polsku. |

---

## Warstwy czy kawałki?

Rozważyłem trzy podejścia:

1. **Same warstwy** (papierowy teatr, shadowbox): płaskie, malowane plany ustawiane jeden za drugim. Na telefonie jest bardzo prosto, a paralaksa wygląda pięknie, ale nie ma tu wiele do roboty. Zostaje tylko kolejność, a scena nie jest prawdziwie trójwymiarowa.
2. **Same kawałki 3D** (wierne zestawy Sankei): wycinasz, zaginasz, kleisz zakładki. To najbliżej oryginału, ale zaginanie i klejenie na małym ekranie szybko męczy, a bez tego zostaje zwykłe puzzle 3D.
3. **Hybryda (rekomendacja):**
   - **Etapy są warstwami.** Najpierw tło (wzgórza, miasteczko, drzewo), potem główna bryła, dach, meble, ozdoby, a na koniec „życie” (kucharz, kot, para nad garnkiem). Gracz zawsze wie, na jakim etapie jest, jak w instrukcji z ponumerowanymi krokami.
   - **W etapie są kawałki.** Na tacy leży kilka kawałków z arkusza, a na scenie widać ich półprzezroczyste zarysy. Przeciągasz kawałek na zarys albo go stukasz, żeby wskoczył sam.
   - **Kawałek składa się sam.** Siatka pudełka albo dachu leży płasko jak na wyprasce, a po trafieniu na miejsce zagina się na oczach gracza. To daje przyjemność składania bez żmudnego klejenia.
   - Dzięki temu scena jest prawdziwą dioramą 3D, którą można obracać, a rozgrywka zostaje prosta jak w Happy Color.

**Prototyp sprawdza właśnie tę hybrydę.** Właściciel gra w niego i decyduje, czy kierunek jest dobry.

## Pętla jednej scenki

1. **Pudełko.** Gracz wybiera zestaw z półki. Pudełko otwiera się i widać arkusze z kawałkami oraz instrukcję.
2. **Składanie etapami.** Taca pokazuje kawałki bieżącego etapu, a scena pokazuje zarysy. Każde trafienie daje stuknięcie kartonu, mały obłoczek kurzu i lekkie ugięcie kawałka. Po skończonym etapie słychać dźwięk dzwoneczka i pojawia się następny.
3. **Ożywienie (finał).** Po ostatnim kawałku zapada zmierzch. Zapalają się lampiony i okna, unosi się para, spadają płatki sakury, noren faluje, kot macha ogonem, a kamera powoli krąży wokół dioramy. To nagroda i główny efekt wow.
4. **Półka.** Gotowa diorama trafia do kolekcji, gdzie można ją obracać i przełączać porę dnia.

**Rytm:** jeden etap to jedna krótka sesja w pociągu. Postęp zapisuje się po każdym kawałku, więc scenkę można odłożyć w dowolnym momencie.

## Pomysły, które dodają głębi (do wyboru przez wykonawcę)

- **Wypychanie z arkusza:** zanim weźmiesz kawałek, wypychasz go z kartonowej wypraski. Mała, satysfakcjonująca czynność, jak folia bąbelkowa.
- **Tryb mistrza:** bez zarysów na scenie, jest tylko rysunek w instrukcji, jak w prawdziwym zestawie.
- **Dźwięk budowany warstwami:** każdy kawałek dodaje coś do tła dźwiękowego. Garnek bulgocze, drzewo szumi, przy lampionie cykają cykady, a po finale gra koto.
- **Drobne wybory dekoracyjne:** kolor noren, napis na lampionie, rasa kota. Bez wpływu na wynik, tylko po to, żeby diorama była „moja”.
- **Pory dnia i pogoda na półce:** deszcz, śnieg albo świetliki na gotowej dioramie.
- **Ulica miniatur:** gotowe dioramy ustawiają się obok siebie i tworzą miasteczko. Kolekcja ma wtedy swój własny efekt wow.
- **Ukryte smaczki:** w każdej scence jest jeden mały sekret do znalezienia po finale, na przykład tanuki za płotem albo kot, który przeniósł się na dach.

## Scenki (propozycja na start)

Każda scenka ma inne miejsce, porę roku i światło w finale. Wykonawca wybiera i dowolnie wymienia.

1. **Yatai z ramenem** (wiosna, wieczór): ta z prototypu.
2. **Przystanek autobusowy na wsi w deszczu** (lato): drewniana wiata, pola ryżowe, żaby, parasol.
3. **Kapliczka Inari w lesie** (jesień): rząd czerwonych bram torii, kamienne lisy, latarnie tōrō.
4. **Sklepik ze słodyczami dagashi** (lato): automaty z napojami, gablotki z cukierkami, rower przed wejściem.
5. **Stacyjka kolejki nad morzem** (lato): peron, szlaban, mały pociąg, morze w tle.
6. **Łaźnia sento** (zima): komin, noren z napisem ゆ, para, śnieg na dachu.
7. **Herbaciarnia w ogrodzie** (jesień): staw z karpiami koi, mostek, klony.
8. **Uliczka na festiwalu matsuri** (lato): stoiska z jedzeniem, lampiony i fajerwerki w finale.

Liczba kawałków rośnie z kolejnymi scenkami. Większe dioramy mają więcej etapów, a nie więcej kawałków w jednym etapie.

## Efekt wow

- **Diorama, która ożywa:** przejście z dnia w wieczór, światło lampionów i okien, para, płatki, ruch tkanin i zwierząt. To musi wzruszać, a nie tylko „ładnie wyglądać”.
- **Karton, który wygląda jak karton:** widoczna grubość i jaśniejszy przekrój na krawędziach, szary spód, delikatne ziarno papieru, a nadruk z cienkim konturem jak w ilustracji.
- **Składanie siatek:** klapki zaginają się kolejno, z lekkim opóźnieniem, a towarzyszy temu szelest papieru.
- **Malowana grafika:** miękkie plamy koloru, bujna trawa, kłębiaste chmury, dużo drobiazgów (zawieszki z menu, ręcznik, miski z ramenem z jajkiem i naruto).

## Grafika: skąd brać malowane tekstury

To największe otwarte pytanie. Prototyp maluje wszystko proceduralnie na canvasie. Wygląda uroczo, ale naiwnie, a do poziomu Ghibli brakuje sporo. Możliwości:

- **Proceduralnie, ale lepiej:** pędzle akwarelowe, mieszanie kolorów, ręcznie dopracowane palety. Działa offline, nie ma kłopotu z prawami, ale wymaga dużo pracy na każdą scenkę.
- **Ilustracje generowane przez model obrazowy**, potem cięte na kawałki skryptem. Szybko i ładnie, ale trudno utrzymać spójność stylu, a trzeba też sprawdzić warunki licencji.
- **Ręcznie malowane atlasy**, na przykład przez ilustratora albo samodzielnie na iPadzie.

**Decyzja właściciela: tylko proceduralnie.** Malujemy staranniej (akwarelowe plamy, mottle, miękkie krawędzie, kontur jak w ilustracji). Ghibli jest tylko inspiracją: projektujemy własne miejsca i postacie, nie używamy motywów z filmów ani nazwy studia w grze.

## Sterowanie

- **Telefon:** przeciągnięcie kawałka z tacy na zarys albo stuknięcie, żeby wskoczył sam. Przeciąganie po tle obraca dioramę, a szczypanie ją przybliża.
- **Laptop:** mysz robi to samo, scroll przybliża.
- **Półka:** przechylenie telefonu delikatnie obraca dioramę (żyroskop).

## Technicznie

- Stack jak w innych grach: Vite, TypeScript, three.js, PWA działająca offline, GitHub Pages i konwencje z `~/code/roj` i `~/code/fala`.
- Scenka jest opisana danymi: lista kawałków z konturem, nadrukiem, miejscem docelowym, etapem i opcjonalną siatką do składania. Dzięki temu nowe scenki dodaje się bez pisania kodu, a agent może je przygotowywać przez skill w repozytorium.
- Prototyp pokazuje trzy rodzaje kawałków: **wycinanki** (kontur wyciągnięty na grubość kartonu), **siatki** (deski na zawiasach, które się zaginają) i **bryły** (garnek, lampion, miski). To prawdopodobnie wystarczy na wszystkie scenki.
- Zapis postępu po każdym kawałku.

## Kamienie milowe

Nadzorca sprawdza wynik po każdym z nich.

- **M0: Prototyp scenki** (zrobione, `~/code/plany/hakoniwa/prototyp/`).
- **M1: Jedna scenka na serio** (zrobione 2026-10-12). Repozytorium, format danych scenki (`src/scenes/types.ts`), Yatai na tym formacie, bloom wieczorem, dźwięk z warstwami, ukryty tanuki, zapis po każdym kawałku, PWA.
- **M2 (szkielet zrobiony 2026-10-12):** półka z pudełkami (okładka renderowana z gotowej dioramy), druga scenka „Przystanek w deszczu” (deszcz z kręgami na kałużach, autobus kursujący w finale, świetliki, kappa jako sekret). **STOP: właściciel testuje na telefonie.** Czy składanie odpręża, czy finał wzrusza i czy grafika ma już klimat. 
- **M2 (zrobione 2026-10-12):** półka jako pokój w 3D (ściana, tatami, regał, światło przez shoji, lampa, ozdoby), gotowe dioramy stoją na półce jako żywe miniatury, pudełka z okładką, pora dnia według zegara, przelot kamery przy otwieraniu; trzecia scenka „Kapliczka Inari” (jesień, torii, kitsunebi); skill `nowa-scenka` do dodawania scenek. Wcześniej, po teście M1: styl anime (cel shading, kontur, nowe pędzle), naprawa białych błysków, przeciąganie bez stukania.
- **M3: Szlif.** Pozostałe scenki, pory dnia i pogoda na półce, ulica miniatur, wybrane pomysły z listy wyżej, tryb offline.

## Ryzyka i otwarte pytania

- **Czy to nie za proste?** Samo kładzenie na zarysy może się szybko znudzić. Pomóc mogą wypychanie z arkusza, tryb mistrza i bogatszy finał. Sprawdzamy w M1.
- **Grafika to większość pracy.** Bez naprawdę ładnych tekstur cały pomysł traci urok. Patrz sekcja o grafice.
- **Przesłanianie:** kawałki z tyłu dioramy (kucharz za wózkiem) łatwo zasłonić. Projekt scenki musi uwzględniać kąt kamery, a w prototypie trzeba było przestawić kucharza.
- **Wydajność na telefonie:** cienie, cząsteczki i duże tekstury przy kilkudziesięciu kawałkach.
