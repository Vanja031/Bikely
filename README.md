## Bikely

**Bikely** je share bike aplikacija implementirana kao monorepo sa tri dela:  
👉 **Projekat je i dalje u izradi (nije završena verzija).**
- **backend** – Node.js + Express + MongoDB (Mongoose)
- **web** – React (Vite)
- **mobile** – React Native (Expo)

Ovaj repozitorijum prati kod za univerzitetski projekat; javni je, ali deo internih beleški i specifikacija ostaje van gita.

---

### Struktura projekta

- `backend/` – REST API, konekcija na MongoDB, autentikacija i poslovna logika (u razvoju)
- `web/` – React web aplikacija (Vite) za korisnike i administratore
- `mobile/` – Expo React Native mobilna aplikacija za korisnike

U svakom podprojektu postoji poseban `README.md` sa detaljima od tog toolchain‑a (Expo, Vite…).

---

## Pokretanje projekta lokalno

### Prerequisites

- **Node.js** (preporuka: verzija 20+)
- **npm**
- Za mobilnu aplikaciju:
  - instaliran **Expo Go** na telefonu (Android/iOS), ili
  - Android/iOS emulator

---

### Backend (`backend/`)

Instalacija dependencija:

```bash
cd backend
npm install
```

Kreiranje `.env` fajla u `backend/`:

```bash
MONGO_URI=mongodb://localhost:27017/bikely
PORT=4000
```

Pokretanje servera:

```bash
cd backend
npm start
```

Backend će raditi na:

- `http://localhost:4000/` – očekivan odgovor: `{ "message": "Bikely backend is running 🚲" }`

---

### Web aplikacija (`web/`)

Instalacija:

```bash
cd web
npm install
```

Pokretanje dev servera:

```bash
cd web
npm run dev
```

Vite će u konzoli prikazati URL (npr. `http://localhost:5173/`) na kojem je dostupna web aplikacija.

---

### Mobilna aplikacija (`mobile/`)

Instalacija:

```bash
cd mobile
npm install
```

Pokretanje:

```bash
cd mobile
npm run start   # ili: npm run android / npm run ios / npm run web
```

Otvara se Expo Dev Tools, odakle je moguće:
- skenirati QR kod pomoću Expo Go aplikacije, ili
- pokrenuti aplikaciju na emulatoru (`npm run android` / `npm run ios`).

---

## Status i plan

**Status:** aktivan razvoj / WIP – nekompletna produkcijska funkcionalnost.  
Planirane funkcionalnosti obuhvataju registraciju/logovanje korisnika, upravljanje biciklima, iznajmljivanja, prijavu problema i administraciju sistema.

## Bikely – Share bike aplikacija

Monorepo za projekat Bikely sa tri dela:
- **backend**: Node.js + Express + MongoDB (Mongoose)
- **web**: React (Vite)
- **mobile**: React Native (Expo)

### Prerequisites

- Instaliran **Node.js** (preporuka: verzija 20+)
- Instaliran **npm**
- Za mobilnu aplikaciju:
  - instaliran **Expo Go** na telefonu (Android/iOS)
  - ili Android/iOS emulator

### Struktura projekta

- `backend/` – REST API, konekcija na MongoDB, autentikacija, poslovna logika (kasnije)
- `web/` – React web aplikacija za korisnike/administratora
- `mobile/` – Expo React Native aplikacija za korisnike

---

## Backend (Node.js + Express + MongoDB)

### Instalacija

```bash
cd backend
npm install
```

> Napomena: `node_modules` je već generisan ako je instalacija već rađena; u suprotnom će se sada instalirati.

### Konfiguracija

U root-u `backend` foldera napravi `.env` fajl:

```bash
MONGO_URI=mongodb://localhost:27017/bikely
PORT=4000
```

Po potrebi promeni `MONGO_URI` na svoju lokaciju MongoDB instance (local ili cloud).

### Pokretanje backend-a

```bash
cd backend
npm start
```

Ako je sve u redu, API će biti dostupan na:

- `http://localhost:4000/` – vraća JSON `{ message: "Bikely backend is running 🚲" }`

---

## Web aplikacija (React + Vite)

### Instalacija

```bash
cd web
npm install
```

### Pokretanje web fronta

```bash
cd web
npm run dev
```

Vite će ispisati URL (npr. `http://localhost:5173/`) na kome je dostupna web aplikacija.

---

## Mobilna aplikacija (React Native + Expo)

### Instalacija

U `mobile` folderu su već instalirani paketi (ako je `npm install` već prošao). Ako nije, pokreni:

```bash
cd mobile
npm install
```

### Pokretanje mobilnog fronta

```bash
cd mobile
npm run start   # ili: npm run android / npm run ios / npm run web
```

Otvoriće se Expo Dev Tools (u browseru ili terminalu) i moći ćeš da:
- skeniraš QR kod pomoću Expo Go aplikacije na telefonu, ili
- pokreneš app na emulatoru (`npm run android` / `npm run ios`).

---

## Dalji razvoj

Za sledeće korake u razvoju:

- Definisati **API rute** u `backend/src` (auth, bicikli, iznajmljivanja, prijave problema, administracija).
- Uspostaviti **komunikaciju** između frontova (`web`, `mobile`) i backend API-ja (npr. preko `axios` ili `fetch`). 
- Postepeno implementirati funkcionalnosti iz `tekst.txt` i `Fukncionalnosti.pdf` za oba tipa korisnika (Korisnik, Administrator).

