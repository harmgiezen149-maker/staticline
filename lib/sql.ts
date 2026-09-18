/**
 * Een SQL-bestand in losse opdrachten knippen.
 *
 * De Neon-driver stuurt één opdracht per aanroep, dus db/schema.sql moet eerst
 * opgeknipt worden. Dat ging eerst met `schema.split(";")`, en dat werkte niet:
 * er staan puntkomma's in de commentaarregels ("…zelf onderhoud vraagt; dit
 * bestand is idempotent…"), en daar knipte het dus middenin een zin. Wat er dan
 * naar Postgres ging was een halve Nederlandse zin, geen SQL.
 *
 * Dat is lang onopgemerkt gebleven omdat de opdracht zelf niets controleert: je
 * ziet de fout pas als je later merkt dat een tabel niet bestaat.
 *
 * Daarom loopt dit teken voor teken. Commentaar wordt overgeslagen, en een
 * puntkomma binnen een tekst tussen aanhalingstekens telt niet als scheiding.
 * Dollar-quoting ($$…$$) kent dit nog niet; dat is er ook niet, en zodra er een
 * functie of trigger bij komt hoort dat hier eerst bij.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inString) {
      current += char;
      if (char === "'") {
        // Twee aanhalingstekens achter elkaar is er één ín de tekst.
        if (next === "'") {
          current += next;
          i++;
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      current += char;
      continue;
    }

    // Commentaar tot het einde van de regel. De regelovergang blijft staan,
    // zodat wat eromheen stond niet aan elkaar plakt.
    if (char === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      current += "\n";
      continue;
    }

    if (char === ";") {
      statements.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  statements.push(current);

  return statements.map((statement) => statement.trim()).filter(Boolean);
}
