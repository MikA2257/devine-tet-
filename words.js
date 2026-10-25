// Listes de mots par catégorie
window.CATEGORIES = [
  {
    id: "celebrites", name: "Célébrités", emoji: "⭐",
    words: ["Zinedine Zidane", "Kylian Mbappé", "Beyoncé", "Michael Jackson", "Céline Dion", "Omar Sy", "Johnny Hallyday",
      "Taylor Swift", "Elon Musk", "Napoléon", "Albert Einstein", "Marie Curie", "Léonard de Vinci", "Cléopâtre",
      "Barack Obama", "Lionel Messi", "Cristiano Ronaldo", "Rihanna", "Stromae", "Aya Nakamura", "Jean Dujardin",
      "Marion Cotillard", "Louis de Funès", "Coco Chanel", "Mozart", "Picasso", "Victor Hugo", "Molière",
      "Brad Pitt", "Leonardo DiCaprio", "Lady Gaga", "Madonna", "Elvis Presley", "Freddie Mercury", "Shakira",
      "Teddy Riner", "Tony Parker", "Serena Williams", "Usain Bolt", "Charles de Gaulle", "Jeanne d'Arc",
      "Louis XIV", "Marie-Antoinette", "Gandhi", "Nelson Mandela", "Steve Jobs", "Bill Gates", "Mark Zuckerberg",
      "Dua Lipa", "Angèle", "Booba", "Jul", "Squeezie", "Antoine Griezmann", "Thomas Pesquet", "Kev Adams",
      "Gad Elmaleh", "Jamel Debbouze", "Mylène Farmer", "Edith Piaf", "Charlie Chaplin", "Marilyn Monroe"]
  },
  {
    id: "personnages", name: "Personnages", emoji: "🦸",
    words: ["Harry Potter", "Dark Vador", "Spider-Man", "Batman", "Superman", "Wonder Woman", "Mario", "Luigi",
      "Pikachu", "Sonic", "Shrek", "Astérix", "Obélix", "Tintin", "Milou", "Lucky Luke", "Les Schtroumpfs",
      "Mickey Mouse", "Donald Duck", "Bob l'éponge", "Homer Simpson", "Bart Simpson", "Pinocchio", "Cendrillon",
      "Blanche-Neige", "La Reine des neiges", "Olaf", "Simba", "Le Roi Lion", "Aladdin", "Le Génie", "Mulan",
      "Hulk", "Iron Man", "Thor", "Captain America", "Le Joker", "Gollum", "Gandalf", "Dracula", "Frankenstein",
      "Sherlock Holmes", "James Bond", "Indiana Jones", "Le Petit Prince", "Peter Pan", "Le Capitaine Crochet",
      "Tarzan", "Zorro", "Robin des Bois", "Le Père Noël", "Barbie", "Ken", "Woody", "Buzz l'Éclair", "Goku",
      "Naruto", "Luffy", "Yoda", "Chewbacca", "Scooby-Doo", "Garfield", "Le Grinch", "Wall-E", "Stitch"]
  },
  {
    id: "animaux", name: "Animaux", emoji: "🐘",
    words: ["Éléphant", "Girafe", "Lion", "Tigre", "Zèbre", "Kangourou", "Koala", "Panda", "Pingouin", "Dauphin",
      "Requin", "Baleine", "Pieuvre", "Crocodile", "Serpent", "Tortue", "Grenouille", "Escargot", "Papillon",
      "Abeille", "Fourmi", "Araignée", "Chauve-souris", "Hibou", "Perroquet", "Flamant rose", "Autruche", "Paon",
      "Poule", "Cochon", "Vache", "Mouton", "Chèvre", "Cheval", "Âne", "Lapin", "Hamster", "Chat", "Chien",
      "Renard", "Loup", "Ours", "Écureuil", "Hérisson", "Castor", "Singe", "Gorille", "Hippopotame",
      "Rhinocéros", "Chameau", "Lama", "Paresseux", "Caméléon", "Méduse", "Homard", "Pélican", "Moustique",
      "Coccinelle", "Taupe", "Raton laveur", "Phoque", "Morse", "Orque"]
  },
  {
    id: "films", name: "Films & séries", emoji: "🎬",
    words: ["Titanic", "Star Wars", "Le Seigneur des anneaux", "Harry Potter", "Avatar", "Jurassic Park",
      "Retour vers le futur", "Les Visiteurs", "Intouchables", "Bienvenue chez les Ch'tis", "Le Dîner de cons",
      "Astérix Mission Cléopâtre", "La Casa de Papel", "Game of Thrones", "Stranger Things", "Friends",
      "Squid Game", "The Walking Dead", "Breaking Bad", "Lupin", "Kaamelott", "Les Simpson", "Pirates des Caraïbes",
      "Le Roi Lion", "La Reine des neiges", "Toy Story", "Le Monde de Nemo", "Shrek", "Ratatouille", "Les Indestructibles",
      "Matrix", "Inception", "Gladiator", "Rocky", "Le Parrain", "Les Dents de la mer", "E.T.", "Ghostbusters",
      "Mamma Mia", "Grease", "La La Land", "Joker", "Barbie", "Top Gun", "Mission Impossible", "Fast & Furious",
      "Les Minions", "Moi, moche et méchant", "Spider-Man", "Avengers", "Le Fabuleux Destin d'Amélie Poulain",
      "OSS 117", "Taxi", "La Grande Vadrouille", "Wednesday", "Emily in Paris", "Le Bureau des légendes"]
  },
  {
    id: "metiers", name: "Métiers", emoji: "👩‍🚒",
    words: ["Pompier", "Policier", "Médecin", "Infirmier", "Dentiste", "Vétérinaire", "Boulanger", "Boucher",
      "Cuisinier", "Serveur", "Pilote", "Hôtesse de l'air", "Astronaute", "Professeur", "Coiffeur", "Plombier",
      "Électricien", "Maçon", "Agriculteur", "Jardinier", "Facteur", "Chauffeur de taxi", "Mécanicien", "Avocat",
      "Juge", "Journaliste", "Photographe", "Peintre", "Sculpteur", "Musicien", "Chanteur", "Danseur", "Acteur",
      "Magicien", "Clown", "Footballeur", "Chirurgien", "Pharmacien", "Architecte", "Informaticien", "Youtubeur",
      "Banquier", "Caissier", "Fleuriste", "Pêcheur", "Bûcheron", "Militaire", "Détective", "Espion", "Pirate",
      "Sauveteur", "Moniteur de ski", "DJ", "Archéologue", "Chef d'orchestre", "Mannequin", "Ramoneur"]
  },
  {
    id: "objets", name: "Objets", emoji: "🧸",
    words: ["Parapluie", "Brosse à dents", "Téléphone", "Ordinateur", "Lunettes", "Montre", "Clé", "Ciseaux",
      "Marteau", "Tournevis", "Aspirateur", "Machine à laver", "Grille-pain", "Micro-ondes", "Réfrigérateur",
      "Lampe", "Bougie", "Miroir", "Peigne", "Sèche-cheveux", "Oreiller", "Couverture", "Chaise", "Canapé",
      "Échelle", "Valise", "Sac à dos", "Ballon", "Vélo", "Trottinette", "Skateboard", "Guitare", "Piano",
      "Trompette", "Tambour", "Appareil photo", "Télécommande", "Casque audio", "Stylo", "Crayon", "Gomme",
      "Cartable", "Livre", "Calendrier", "Réveil", "Fourchette", "Cuillère", "Couteau", "Casserole", "Poêle",
      "Tire-bouchon", "Arrosoir", "Balai", "Seau", "Boussole", "Jumelles", "Loupe", "Cadenas", "Trombone",
      "Agrafeuse", "Ventilateur", "Radiateur", "Chaussette", "Cravate", "Chapeau"]
  },
  {
    id: "nourriture", name: "Nourriture", emoji: "🍕",
    words: ["Pizza", "Hamburger", "Frites", "Croissant", "Baguette", "Pain au chocolat", "Crêpe", "Gaufre",
      "Raclette", "Fondue", "Tartiflette", "Croque-monsieur", "Quiche", "Ratatouille", "Couscous", "Paella",
      "Sushi", "Lasagnes", "Spaghetti", "Hot-dog", "Kebab", "Tacos", "Salade", "Soupe", "Omelette", "Fromage",
      "Camembert", "Yaourt", "Glace", "Chocolat", "Macaron", "Éclair", "Tarte aux pommes", "Mousse au chocolat",
      "Crème brûlée", "Banane", "Pomme", "Fraise", "Ananas", "Pastèque", "Citron", "Cerise", "Raisin", "Carotte",
      "Tomate", "Brocoli", "Champignon", "Avocat", "Pop-corn", "Bonbon", "Barbe à papa", "Nutella", "Ketchup",
      "Moutarde", "Escargots", "Cuisses de grenouille", "Huître", "Churros", "Donut", "Cookie", "Brioche"]
  },
  {
    id: "lieux", name: "Pays & lieux", emoji: "🌍",
    words: ["France", "Italie", "Espagne", "Japon", "Chine", "Brésil", "États-Unis", "Canada", "Mexique", "Égypte",
      "Australie", "Inde", "Russie", "Maroc", "Sénégal", "Grèce", "Suisse", "Belgique", "Angleterre", "Allemagne",
      "Paris", "New York", "Londres", "Rome", "Venise", "Tokyo", "Marseille", "Lyon", "Las Vegas", "Hollywood",
      "Tour Eiffel", "Statue de la Liberté", "Pyramides", "Muraille de Chine", "Mont-Saint-Michel", "Colisée",
      "Big Ben", "Disneyland", "Le Louvre", "Château de Versailles", "Arc de Triomphe", "Mont Blanc", "Le Sahara",
      "L'Amazonie", "Le pôle Nord", "La Lune", "Mars", "Hawaï", "Tahiti", "La Corse", "Bretagne", "Le Taj Mahal",
      "Machu Picchu", "Stonehenge", "Atlantide", "Pise", "Le Kremlin", "Copacabana"]
  },
  {
    id: "sports", name: "Sports & loisirs", emoji: "⚽",
    words: ["Football", "Rugby", "Tennis", "Basket", "Handball", "Volley", "Natation", "Ski", "Snowboard", "Surf",
      "Judo", "Karaté", "Boxe", "Escrime", "Golf", "Pétanque", "Bowling", "Billard", "Ping-pong", "Badminton",
      "Cyclisme", "Tour de France", "Marathon", "Saut à la perche", "Gymnastique", "Patinage artistique", "Hockey",
      "Équitation", "Escalade", "Parachute", "Plongée", "Voile", "Kayak", "Yoga", "Danse classique", "Breakdance",
      "Zumba", "Échecs", "Fléchettes", "Curling", "Sumo", "Lancer de javelot", "Baseball", "Formule 1",
      "Jeux Olympiques", "Coupe du monde", "Paddle", "Trampoline", "Pêche", "Randonnée", "Jeux vidéo", "Karaoké"]
  },
  {
    id: "mimes", name: "Actions à mimer", emoji: "🎭",
    words: ["Se brosser les dents", "Faire du vélo", "Conduire une voiture", "Nager le crawl", "Pêcher", "Danser le tango",
      "Faire un selfie", "Jongler", "Éternuer", "Bâiller", "Ronfler", "Faire la vaisselle", "Repasser", "Passer l'aspirateur",
      "Faire des pompes", "Sauter à la corde", "Jouer de la guitare", "Jouer du piano", "Diriger un orchestre",
      "Prendre une douche", "Se maquiller", "Se raser", "Promener un chien", "Traire une vache", "Escalader une montagne",
      "Faire du ski", "Surfer", "Monter à cheval", "Tirer à l'arc", "Lancer une boule de neige", "Manger des spaghettis",
      "Ouvrir un cadeau", "Changer une couche", "Faire un gâteau", "Chanter sous la douche", "Marcher sur la Lune",
      "Être un robot", "Être un zombie", "Faire du karaté", "Dribbler au basket", "Tondre la pelouse", "Faire du yoga",
      "Gonfler un ballon", "Taper à l'ordinateur", "Attraper un moustique", "Marcher sur des braises", "Faire un pique-nique",
      "Se faire piquer par une abeille", "Faire une demande en mariage", "Rater le bus"]
  }
];
