// Personnes réelles ou fictives, par catégorie
window.CATEGORIES = [
  {
    id: "footballeurs", name: "Footballeurs", emoji: "⚽",
    words: ["Kylian Mbappé", "Zinédine Zidane", "Lionel Messi", "Cristiano Ronaldo", "Antoine Griezmann", "Karim Benzema",
      "Neymar", "Thierry Henry", "Michel Platini", "Pelé", "Diego Maradona", "Ronaldinho", "Erling Haaland", "Olivier Giroud",
      "Paul Pogba", "N'Golo Kanté", "Hugo Lloris", "Franck Ribéry", "Didier Deschamps", "David Beckham", "Zlatan Ibrahimović",
      "Mohamed Salah", "Kevin De Bruyne", "Luka Modrić", "Robert Lewandowski", "Vinícius Júnior", "Jude Bellingham",
      "Ousmane Dembélé", "Éric Cantona", "Fabien Barthez", "Lilian Thuram", "Jean-Pierre Papin", "Didier Drogba",
      "Samuel Eto'o", "Gianluigi Buffon", "Andrés Iniesta", "Sergio Ramos", "Iker Casillas", "Wayne Rooney", "Kaká",
      "Ronaldo (le Brésilien)", "Johan Cruyff", "Franz Beckenbauer", "Mike Maignan", "William Saliba", "Lamine Yamal",
      "Harry Kane", "Achraf Hakimi", "Riyad Mahrez", "Wendie Renard", "Marcus Thuram", "Bixente Lizarazu"]
  },
  {
    id: "sportifs", name: "Sportifs", emoji: "🏅",
    words: ["Teddy Riner", "Tony Parker", "Victor Wembanyama", "Usain Bolt", "Serena Williams", "Roger Federer", "Rafael Nadal",
      "Novak Djokovic", "Yannick Noah", "Michael Jordan", "LeBron James", "Kobe Bryant", "Muhammad Ali", "Mike Tyson",
      "Tiger Woods", "Michael Phelps", "Léon Marchand", "Florent Manaudou", "Laure Manaudou", "Antoine Dupont",
      "Sébastien Chabal", "Martin Fourcade", "Marie-José Pérec", "Renaud Lavillenie", "Kevin Mayer", "Lewis Hamilton",
      "Michael Schumacher", "Ayrton Senna", "Max Verstappen", "Sébastien Loeb", "Alain Prost", "Bernard Hinault",
      "Julian Alaphilippe", "Tadej Pogačar", "Simone Biles", "Nadia Comăneci", "Tony Hawk", "Kelly Slater",
      "Nikola Karabatic", "Clarisse Agbégnénou", "Jean-Claude Killy", "Gaël Monfils", "Francis Ngannou", "Conor McGregor",
      "Tom Brady", "Stephen Curry", "Shaquille O'Neal", "Eddy Merckx", "Mary Pierce", "Cyril Gane"]
  },
  {
    id: "acteurs", name: "Acteurs & actrices", emoji: "🎬",
    words: ["Omar Sy", "Jean Dujardin", "Marion Cotillard", "Louis de Funès", "Jean Reno", "Christian Clavier", "Dany Boon",
      "Kad Merad", "Gad Elmaleh", "Jamel Debbouze", "Audrey Tautou", "Sophie Marceau", "Catherine Deneuve", "Brigitte Bardot",
      "Alain Delon", "Jean-Paul Belmondo", "Vincent Cassel", "Léa Seydoux", "Juliette Binoche", "Pierre Niney",
      "François Cluzet", "José Garcia", "Franck Dubosc", "Kev Adams", "Bourvil", "Pierre Richard", "Brad Pitt",
      "Leonardo DiCaprio", "Tom Cruise", "Johnny Depp", "Angelina Jolie", "Julia Roberts", "Meryl Streep",
      "Scarlett Johansson", "Margot Robbie", "Ryan Gosling", "Keanu Reeves", "Will Smith", "Dwayne Johnson", "Jackie Chan",
      "Arnold Schwarzenegger", "Sylvester Stallone", "Morgan Freeman", "Tom Hanks", "Robert De Niro", "Jim Carrey",
      "Charlie Chaplin", "Marilyn Monroe", "Zendaya", "Timothée Chalamet", "Emma Watson", "Daniel Radcliffe",
      "Nicole Kidman", "Bruce Willis", "Harrison Ford", "Rowan Atkinson"]
  },
  {
    id: "chanteurs", name: "Chanteurs & musiciens", emoji: "🎤",
    words: ["Michael Jackson", "Madonna", "Beyoncé", "Rihanna", "Taylor Swift", "Lady Gaga", "Céline Dion", "Johnny Hallyday",
      "Édith Piaf", "Mylène Farmer", "Stromae", "Aya Nakamura", "Angèle", "Jul", "Booba", "Orelsan", "Soprano", "Gims",
      "Indila", "Zaz", "Christophe Maé", "Francis Cabrel", "Jean-Jacques Goldman", "Charles Aznavour", "Serge Gainsbourg",
      "Jacques Brel", "Claude François", "Vianney", "Matt Pokora", "Kendji Girac", "Louane", "Renaud", "Michel Sardou",
      "Vanessa Paradis", "Elvis Presley", "Freddie Mercury", "Elton John", "John Lennon", "Mick Jagger", "Bob Marley",
      "Shakira", "Ed Sheeran", "Adele", "Bruno Mars", "Eminem", "Snoop Dogg", "Billie Eilish", "Dua Lipa", "Ariana Grande",
      "Justin Bieber", "David Guetta", "Mozart", "Beethoven", "Nekfeu", "Slimane"]
  },
  {
    id: "personnalites", name: "Personnalités & influenceurs", emoji: "📺",
    words: ["Elon Musk", "Bill Gates", "Mark Zuckerberg", "Jeff Bezos", "Steve Jobs", "Squeezie", "Cyprien", "Norman",
      "Inoxtag", "Michou", "Tibo InShape", "Mister V", "Kim Kardashian", "Kylie Jenner", "Cyril Hanouna", "Nagui",
      "Michel Drucker", "Stéphane Bern", "Mimie Mathy", "Philippe Etchebest", "Cyril Lignac", "Gordon Ramsay",
      "Oprah Winfrey", "Thomas Pesquet", "Barack Obama", "Emmanuel Macron", "Donald Trump", "La reine Elizabeth II",
      "Le prince Harry", "Greta Thunberg", "Le pape François", "Jean-Pierre Pernaut", "Léna Situations", "MrBeast",
      "Paris Hilton", "Karl Lagerfeld", "Coco Chanel", "Walt Disney"]
  },
  {
    id: "historiques", name: "Personnages historiques", emoji: "📜",
    words: ["Napoléon", "Jeanne d'Arc", "Louis XIV", "Marie-Antoinette", "Jules César", "Cléopâtre", "Charlemagne",
      "Vercingétorix", "Christophe Colomb", "Léonard de Vinci", "Albert Einstein", "Marie Curie", "Isaac Newton",
      "Charles de Gaulle", "Abraham Lincoln", "Gandhi", "Nelson Mandela", "Martin Luther King", "Toutânkhamon",
      "Alexandre le Grand", "Gengis Khan", "Victor Hugo", "Molière", "Pablo Picasso", "Vincent van Gogh", "Claude Monet",
      "Neil Armstrong", "Youri Gagarine", "Louis Pasteur", "Thomas Edison", "Galilée", "Socrate", "Henri IV", "Louis XVI",
      "Robespierre", "Winston Churchill", "Che Guevara", "Mère Teresa", "Frida Kahlo", "William Shakespeare",
      "Charles Darwin", "Simone Veil", "Joséphine Baker", "Marco Polo", "Attila", "Ramsès II", "Gustave Eiffel",
      "Jean de La Fontaine", "Rosa Parks"]
  },
  {
    id: "superheros", name: "Super-héros & méchants", emoji: "🦸",
    words: ["Superman", "Batman", "Spider-Man", "Wonder Woman", "Iron Man", "Captain America", "Thor", "Hulk", "Black Widow",
      "Wolverine", "Deadpool", "Black Panther", "Doctor Strange", "Captain Marvel", "Aquaman", "Flash", "Green Lantern",
      "Catwoman", "Le Joker", "Harley Quinn", "Thanos", "Loki", "Magnéto", "Venom", "Le Bouffon vert", "Ant-Man",
      "Daredevil", "Hellboy", "Groot", "Star-Lord", "Rocket", "Vision", "La Sorcière rouge", "Hawkeye", "Robin",
      "Le Pingouin", "Professeur Xavier", "Tornade", "Cyclope", "Shazam", "Mister Indestructible", "Ultron", "Bane",
      "Lex Luthor", "Docteur Octopus", "Nick Fury", "Silver Surfer", "Miles Morales", "Supergirl", "Mystique"]
  },
  {
    id: "dessinsanimes", name: "Dessins animés", emoji: "🐭",
    words: ["Mickey", "Minnie", "Donald Duck", "Dingo", "Bugs Bunny", "Titi", "Grosminet", "Tom (Tom et Jerry)", "Jerry",
      "Scooby-Doo", "Homer Simpson", "Bart Simpson", "Marge Simpson", "Bob l'éponge", "Patrick l'étoile de mer", "Shrek",
      "L'Âne (Shrek)", "Le Chat Potté", "Simba", "Timon", "Pumbaa", "Scar", "Aladdin", "Le Génie", "Jasmine", "Mulan",
      "Ariel", "Elsa", "Olaf", "Raiponce", "Cendrillon", "Blanche-Neige", "La Belle (et la Bête)", "Peter Pan",
      "Le Capitaine Crochet", "Pinocchio", "Dumbo", "Bambi", "Winnie l'ourson", "Tigrou", "Woody", "Buzz l'Éclair", "Nemo",
      "Dory", "Stitch", "Vaiana", "Pikachu", "Sacha (Pokémon)", "Son Goku", "Naruto", "Luffy", "Totoro", "Peppa Pig",
      "T'choupi", "Gru", "Les Minions", "Ladybug", "Chat Noir", "Barbapapa", "Garfield", "Snoopy", "Popeye", "Betty Boop",
      "Le Grand Schtroumpf", "Gargamel", "Inspecteur Gadget", "Wall-E", "Flash McQueen", "Maléfique", "Cruella", "Ursula",
      "Le Grinch", "Rémy (Ratatouille)", "Sid (L'Âge de glace)", "Po (Kung Fu Panda)", "Caliméro"]
  },
  {
    id: "films", name: "Films & séries", emoji: "🍿",
    words: ["Harry Potter", "Hermione Granger", "Ron Weasley", "Dumbledore", "Voldemort", "Hagrid", "Luke Skywalker", "Yoda",
      "Han Solo", "Princesse Leia", "Chewbacca", "Gandalf", "Frodon", "Gollum", "Aragorn", "James Bond", "Indiana Jones",
      "Jack Sparrow", "Rocky Balboa", "Terminator", "Forrest Gump", "E.T.", "King Kong", "Godzilla", "Dracula", "Frankenstein",
      "Sherlock Holmes", "Hannibal Lecter", "Rambo", "Marty McFly", "Doc Brown", "Neo (Matrix)", "Le Professeur (La Casa de Papel)",
      "Jon Snow", "Daenerys Targaryen", "Walter White", "Eleven (Stranger Things)", "Mercredi Addams", "Assane Diop (Lupin)",
      "Perceval (Kaamelott)", "Jacquouille la Fripouille", "Godefroy de Montmirail", "OSS 117", "Barbie", "Ken", "Mary Poppins",
      "Willy Wonka", "Edward aux mains d'argent", "Katniss Everdeen", "Mr Bean", "Freddy Krueger", "Chucky", "Dark Vador",
      "Bridget Jones", "Jason Bourne"]
  },
  {
    id: "contes", name: "Contes, livres & BD", emoji: "📚",
    words: ["Tintin", "Le capitaine Haddock", "Milou", "Astérix", "Obélix", "Panoramix", "Idéfix", "Lucky Luke", "Les Dalton",
      "Gaston Lagaffe", "Titeuf", "Spirou", "Le Petit Prince", "Le Petit Nicolas", "Boule et Bill", "Le Petit Chaperon rouge",
      "Le Grand Méchant Loup", "Le Chat botté", "Barbe Bleue", "Boucle d'or", "Alice (au pays des merveilles)",
      "Le Chapelier fou", "Le Lapin blanc", "La Reine de cœur", "Robin des Bois", "Le Père Noël", "La Petite Souris",
      "Ali Baba", "Sinbad", "Merlin l'Enchanteur", "Le roi Arthur", "Don Quichotte", "D'Artagnan", "Cyrano de Bergerac",
      "Quasimodo", "Esmeralda", "Jean Valjean", "Cosette", "Gavroche", "Tarzan", "Mowgli", "Baloo", "La Belle au bois dormant",
      "Le Petit Poucet", "Hansel et Gretel", "Arsène Lupin", "Le Comte de Monte-Cristo", "Hercule Poirot", "Zorro", "Fantômas"]
  },
  {
    id: "jeuxvideo", name: "Jeux vidéo", emoji: "🎮",
    words: ["Mario", "Luigi", "Princesse Peach", "Bowser", "Yoshi", "Donkey Kong", "Wario", "Link", "Zelda", "Ganondorf",
      "Sonic", "Tails", "Dr. Robotnik", "Pac-Man", "Lara Croft", "Kratos", "Master Chief", "Steve (Minecraft)", "Kirby",
      "Samus Aran", "Rayman", "Les Lapins Crétins", "Crash Bandicoot", "Spyro", "Ezio Auditore", "Cloud Strife",
      "Solid Snake", "Ryu (Street Fighter)", "Chun-Li", "Toad", "Mega Man", "Ellie (The Last of Us)", "Geralt de Riv",
      "Arthur Morgan", "CJ (GTA San Andreas)", "Professeur Layton", "Tom Nook", "Sackboy", "Mewtwo", "Rondoudou",
      "Pikachu", "Bomberman", "Captain Toad", "Leon Kennedy"]
  }
];

// Nettoyage : mots uniques par catégorie
window.CATEGORIES.forEach((c) => { c.words = [...new Set(c.words)]; });
