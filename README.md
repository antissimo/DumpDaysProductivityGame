# Venio Flow Lab

## Pokretanje lokalno

1. Otvori terminal u mapi projekta:

```powershell
cd "c:\Users\bosko\OneDrive\Radna površina\DumpDaysProductivityGame"
```

2. Pokreni igru:

```powershell
npm install
npm start
```

3. Otvori preglednik i idi na:

```text
http://localhost:3000
```

## Što je novo

- Venio branding i boje tematski usklađene s Venio logom
- Cijevi su sada sve vidljive u mreži bez skrolanja
- Rezultati leaderboarda spremaju se u `scores.json`
- Igra pokušava sinkronizirati rezultate s lokalnim API-em na `http://localhost:3000/api/scores`
