// =========================================================
//  Reverse-A-Phone — phrase bank (4 difficulty tiers)
//  EASY   = 2-word phrases   (~400+)
//  MEDIUM = 3-word phrases   (~400+)
//  HARD   = 4-word phrases   (~400+)
//  PRO    = 5-6-word phrases (~400+, original list)
// =========================================================

const PHRASES_EASY = [
  // Animals
  "big dog","fat cat","red fox","blue jay","pink pig","grey owl","wild bear","young deer",
  "small frog","fast hawk","slow snail","loud crow","tiny ant","dark bat","warm hen",
  "huge whale","cute lamb","free bird","brave bull","sharp claw","long snake","sweet bee",
  "black cat","white dog","gold fish","tree frog","sea horse","sand crab","mud duck","wolf pack",
  "barn owl","black crow","brown bear","grey wolf","blue crab","red bird","green frog","wild cat",
  "tame dog","pond fish","bay horse","sea gull","fire ant","dung fly","stone fish","moon rat",
  "rock dove","milk cow","ice bear","dust mite","cave bat","silk worm","dew drop","mud lark",
  // Food
  "hot soup","cold milk","fresh bread","sweet cake","spicy taco","fried egg","boiled rice",
  "ripe mango","sour lime","salted fish","grilled corn","raw carrot","baked pie","dry toast",
  "thick soup","thin crust","dark rum","warm tea","iced cake","sharp cheese","soft roll",
  "burnt toast","smooth jam","chunky stew","red wine","white rice","brown bread","green tea",
  "black bean","blue cheese","sweet corn","sour milk","hot sauce","cold brew","flat bread",
  "steam bun","crisp chip","cream puff","plum jam","fig roll","date cake","pine nut",
  "sesame seed","olive oil","palm sugar","cane juice","rose hip","star fruit","bell pepper",
  // Colors & Adjectives
  "bright light","dark night","loud sound","soft touch","cold wind","hot sun","deep sea",
  "high peak","low vale","wide road","thin ice","thick fog","clear sky","cloudy day",
  "calm lake","rough sea","sharp knife","dull blade","bright gem","pale moon","bold stroke",
  "faint glow","bare rock","dense wood","steep cliff","flat plain","steep hill","dusty path",
  // Actions
  "jump high","run fast","swim deep","fly free","sing loud","dance wild","sleep late",
  "wake early","work hard","play fair","laugh loud","cry soft","stand tall","sit still",
  "walk slow","eat well","drink deep","dream big","think fast","move quick","look sharp",
  "feel good","smell sweet","sound right","taste great","touch warm","love deep","hate less",
  "give more","take less","share all","help out","push hard","pull back","turn left","turn right",
  "step up","step back","reach high","dig deep","climb fast","fall slow","roll back","spin fast",
  // Nature
  "bright star","full moon","blue sky","green grass","tall tree","wild rose","red leaf",
  "white snow","warm rain","cold frost","dark cloud","strong wind","soft breeze","deep root",
  "wide river","long road","high cliff","low tide","bare branch","sharp thorn","sweet bloom",
  "dry sand","wet mud","hard rock","soft clay","clear stream","rough stone","smooth pebble",
  "warm soil","cool shade","bright dawn","dark dusk","calm night","stormy day","thin mist",
  "thick smoke","pure ice","salty sea","fresh dew","morning mist","evening star","noon sun",
  // Emotions & States
  "feel happy","be brave","stay calm","look sharp","act cool","seem lost","stay true",
  "feel sick","seem fine","act wild","stay still","be free","feel proud","seem shy",
  "act bold","stay safe","feel warm","be kind","seem mad","stay close","be smart",
  "feel alive","stay strong","be gentle","seem angry","feel empty","stay quiet","be honest",
  // Everyday objects
  "red book","blue pen","sharp key","old clock","new lamp","soft bed","hard floor",
  "clean cup","dirty plate","full glass","empty bowl","wide door","small window","long rope",
  "thick chain","thin wire","rough cloth","smooth silk","bright coin","dull stone","sharp pin",
  "blunt nail","strong glue","weak tape","loud bell","mute phone","cold ring","warm coat",
  // Places
  "dark cave","bright room","long hall","wide yard","small shed","tall tower","old barn",
  "new shop","busy street","quiet lane","deep well","high wall","stone bridge","wood fence",
  "iron gate","glass door","steel beam","brick wall","mud hut","stone house","wood cabin",
  // Extra random
  "top shelf","back row","front seat","side door","roof top","ground floor","main road",
  "side path","dead end","steep grade","smooth track","rough trail","paved lane","dirt road",
  "thin air","thick dust","cold stone","warm sand","cool water","hot metal","soft light",
  "hard fact","clear view","blurred line","sharp edge","dull ache","sweet taste","bitter pill",
  "sour note","flat tone","high pitch","low hum","loud clap","soft knock","heavy rain","light snow",
];

const PHRASES_MEDIUM = [
  // Nursery & classic
  "row your boat","clap your hands","ring the bell","fly a kite","catch the ball","kick the can",
  "feed the birds","walk the dog","ride the bus","climb the tree","cross the road","hold the door",
  "light the lamp","lock the gate","read the sign","throw the dice","spin the wheel","pull the rope",
  "blow the horn","ring a bell","beat the drum","strum the strings","hum a tune","sing a song",
  "draw a line","paint the wall","build a bridge","fix the roof","plant a seed","water the plant",
  // Daily life
  "wake up early","eat your food","brush your teeth","wash your hands","comb your hair","tie your shoes",
  "make the bed","clean the room","do the dishes","fold the clothes","take a bath","go to sleep",
  "drink some water","have some tea","grab a snack","cook the rice","boil some eggs","fry the bacon",
  "bake a cake","cut the bread","stir the soup","set the table","clear the plates","dry the cups",
  "pack your bag","check the clock","open the door","close the window","switch the light","turn the fan",
  "charge your phone","check the mail","read the news","write a note","call your friend","send a text",
  // Emotions & interactions
  "say thank you","say excuse me","be very kind","stay very calm","feel so good","look so sad",
  "act so brave","seem so lost","stay so true","feel so free","be so smart","seem so shy",
  "feel the love","share the joy","spread the warmth","find the peace","seek the truth","know your worth",
  "trust your gut","follow your heart","face your fears","own your truth","find your way","know the path",
  // Nature & outdoors
  "climb a tree","wade the creek","feel the breeze","watch the stars","catch the rain","see the dawn",
  "walk the beach","swim the lake","cross the field","run the trail","hike the hill","climb the peak",
  "sail the bay","fish the pond","pick the berries","find the nest","track the deer","spot the hawk",
  "see the comet","watch the clouds","feel the sun","smell the pines","hear the waves","touch the snow",
  "feel the frost","see the fog","smell the rain","taste the dew","hear the wind","feel the mud",
  "wade through mud","walk through snow","run through rain","jump in puddles","climb over rocks","swim upstream",
  // Food & drink
  "eat some cake","drink some juice","try the soup","taste the stew","have some bread","grab a slice",
  "pour the tea","mix the batter","knead the dough","roll the dough","cut the pie","serve the meal",
  "chop the onion","peel the apple","slice the bread","grate the cheese","mash the potato","whip the cream",
  "stir the pot","heat the pan","cool the dish","plate the food","dress the salad","toss the greens",
  // Travel & places
  "catch the train","miss the bus","take the road","cross the bridge","climb the stairs","take the lift",
  "park the car","ride the bike","walk the path","follow the map","read the sign","check the route",
  "find the gate","board the plane","land the craft","dock the ship","moor the boat","drop the anchor",
  "pack the bags","check the ticket","stamp the passport","clear the customs","find your seat","stow your bag",
  // Sports & games
  "score a goal","hit a home run","throw a punch","take a swing","land a kick","block the shot",
  "serve the ball","return the volley","spike the ball","set the play","run the play","call the shot",
  "make the cut","win the match","lose the game","draw the set","flip a coin","roll the dice",
  "deal the cards","play your hand","show your cards","call the bluff","raise the stakes","fold your hand",
  // Fun & silly
  "boo the ghost","pet the llama","hug a cactus","chase the rainbow","kiss a frog","fight a bear",
  "feed a dragon","train a parrot","ride an ostrich","juggle the eggs","moonwalk in mud","yodel at dawn",
  "tickle the shark","race a snail","argue with a cloud","wrestle the wind","debate the moon","outrun your shadow",
  "dance with penguins","sing to fish","talk to trees","whisper to rocks","listen to walls","ask the sky",
  // Tech & modern
  "plug it in","turn it on","log me in","back it up","shut it down","restart the machine",
  "update the app","clear the cache","delete the file","save the draft","print the page","scan the code",
  "share the link","mute the mic","end the call","join the chat","leave the group","read the thread",
  "like the post","share the reel","follow the account","block the user","report the spam","flag the content",
  // General action phrases
  "make a wish","flip the switch","break the mold","push the limit","cross the line","raise the bar",
  "set the pace","lead the way","pave the road","light the path","hold the line","guard the gate",
  "mark the spot","find the clue","solve the case","crack the code","break the lock","open the safe",
  "count the stars","map the sky","chart the course","plot the route","trace the line","draw the plan",
  "lay the ground","build the base","pour the foundation","frame the wall","raise the roof","trim the edge",
];

const PHRASES_HARD = [
  // Nature & environment
  "calm before storm","stars fill the sky","leaves hit the ground","wind bends the trees",
  "rain hits the roof","snow fills the yard","fog rolls in thick","sun sets behind hills",
  "moon lights the path","clouds drift on by","creek flows to river","tide pulls the sand",
  "wave breaks on shore","fish jump at dusk","birds call at dawn","wolf howls at night",
  "deer cross the road","bears wake from sleep","ants march in line","bees guard the hive",
  "flowers open wide","seeds float on wind","roots drink from soil","trees reach for light",
  "ice cracks in spring","mud dries in heat","dust blows in wind","frost forms at night",
  "dew drops at dawn","mist lifts at noon","hail beats the crop","flood fills the plain",
  // Action & adventure
  "jump over the fence","run down the hill","swim across the lake","climb up the cliff",
  "ride through the storm","race down the track","sail into the wind","hike to the peak",
  "dive to the deep","roll down the slope","slide on the ice","leap off the rock",
  "sprint past the line","dart through the crowd","weave through the trees","dodge all the rocks",
  "vault over the wall","scale the tall tower","cross the wide river","ford the rushing stream",
  // Food & cooking
  "boil the water first","chop the onions small","grate the firm cheese","roll the dough thin",
  "fold the egg whites","mix the batter well","grease the baking tin","preheat the oven now",
  "dust with some flour","drizzle with olive oil","season with some salt","garnish with fresh herbs",
  "serve while still hot","cool on a wire rack","slice into even parts","store in airtight box",
  "blend until very smooth","whisk until stiff peaks","knead until very soft","proof until doubled up",
  // Everyday life
  "wake up before dawn","skip breakfast today","miss the early bus","catch the later train",
  "work late every night","leave the office early","eat lunch at the desk","drink coffee all day",
  "check the phone often","reply to all emails","join another long call","mute the noisy app",
  "close too many tabs","restart the old laptop","print the last page","scan the old receipt",
  "pay the water bill","call the repair shop","wait for the plumber","fix the leaky pipe",
  "patch the cracked wall","sand the rough floor","stain the bare wood","seal the old grout",
  // Emotions & relationships
  "tell me how you feel","show me that you care","prove that love is real","find what makes you whole",
  "face your deepest fear","trust that it gets better","know you are enough","let the past stay there",
  "learn from every fall","grow through all the pain","rise above the noise","keep your head held high",
  "stay true to yourself","speak your truth aloud","stand up for your rights","own your every flaw",
  // Sports & games
  "score in extra time","hit the upper ninety","serve an absolute ace","land a perfect smash",
  "throw for the endzone","block the penalty kick","tackle from behind hard","sprint to the baseline",
  "play a drop shot clean","volley from the net post","chip it from the rough","putt from twenty feet",
  "bowl a perfect game","roll three strikes straight","card a hole in one","sink the eight ball clean",
  "call an audible play","run a pick and roll","set a solid screen here","crash the offensive boards",
  // Humor & silly
  "trip on flat ground here","forget where I put it","talk to the wrong person","wave at a stranger twice",
  "laugh at the wrong time","sneeze during the quiet","hiccup in the meeting","yawn during the speech",
  "drop the soap in store","slip on a banana","stub my little toe hard","walk into the glass door",
  "reply to the wrong chat","send the wrong emoji","call the boss by mistake","forget my own password",
  // Travel & places
  "catch the early flight","miss the connecting gate","lose my boarding pass","check the wrong luggage",
  "sleep through the alarm","pack the wrong adaptor","book the wrong hotel","arrive a day late",
  "take the wrong exit here","drive past the turn again","park in the wrong lot","feed the parking meter",
  "read the paper map wrong","argue with the sat nav","ignore the toll booth sign","speed through school zone",
  // Technology
  "update all the apps now","clear the browser cache","reset the wifi router","pair the new device here",
  "restore from a backup","wipe the old hard drive","clone the repo locally","push the feature branch",
  "merge the pull request","resolve the merge conflict","deploy to production now","monitor the server logs",
  "scale the database up","index the search fields","cache the api response","queue the background job",
  // Philosophy & wisdom
  "think before you speak","look before you leap","act before it's too late","learn before you teach",
  "give before you take","love before you judge","live before you die","ask before you assume",
  "try before you quit","lead before you follow","share before you hoard","heal before you fight",
  "breathe before you react","pause before you decide","rest before you push","reflect before you act",
  // Science & nature facts
  "light bends in water","sound travels in waves","heat rises in air","cold sinks to floor",
  "plants make their food","cells divide in two","stars burn their fuel","planets orbit the sun",
  "moons pull the tides","winds circle the globe","rivers carve the rock","ice grinds down stone",
  "volcanoes build islands","quakes reshape the land","glaciers flow downhill","deserts spread each year",
  // School & study
  "read the whole chapter","write the final draft","take the big test","fail the pop quiz",
  "pass with flying colors","study all night long","cram for the exam","ace every single test",
  "raise your hand please","copy from the board","lose the hall pass","forget your homework",
  "skip the boring lecture","sleep through the class","doodle in the margins","pack up your things",
  // Arts & creativity
  "paint the whole canvas","sketch a rough draft","sculpt from wet clay","carve into the wood",
  "strum the guitar fast","beat the drums loud","blow the brass horn","pluck the violin string",
  "write a short poem","read the verse aloud","stage the whole play","learn all your lines",
  "sew the final seam","cut along the line","fold the paper neat","glue the pieces down",
  // Body & health
  "stretch every single morning","jog around the block","lift the heavy weights","do the morning yoga",
  "drink more water please","sleep a full eight","cut out the sugar","take your daily pills",
  "rest that sore knee","ice the swollen joint","wrap the twisted ankle","elevate the hurt leg",
  "breathe through the pain","push through the burn","feel the muscle ache","earn your rest day",
  // Weather & emergencies
  "brace for the storm","hunker down inside","board up the windows","fill the sandbags fast",
  "check the weather app","pack an emergency kit","charge all your devices","fill the bathtub up",
  "watch the radar spin","track the storm path","clean the fallen tree","mop the flooded floor",
  // Animals behaving badly
  "cat knocks things off","dog chews the furniture","bird mimics your voice","fish leaps from tank",
  "hamster runs all night","rabbit hides the carrots","parrot swears in Spanish","gecko climbs the wall",
  "goat eats your mail","chicken escapes the coop","pig rolls in the mud","cow jumps the fence",
  "horse bucks the rider","goose chases the child","duck waddles right inside","dog steals your socks",
  // Random life moments
  "drop your keys again","lock yourself right out","lose the TV remote","trip on your own feet",
  "spill the morning coffee","burn the morning toast","sleep through your alarm","miss the trash day",
  "forget the grocery list","buy the wrong item","return it without receipt","wait in the long line",
  "drop your card again","enter the wrong PIN","dial the wrong number","text the wrong contact",
];


const PHRASES_PRO = [
  // Nursery rhymes & children's classics
  "Mary had a little lamb","Old MacDonald had a farm","Row row row your boat",
  "Jack and Jill went up","Humpty Dumpty sat on wall","Little Miss Muffet sat down",
  "Itsy bitsy spider climbed up","Hickory dickory dock the mouse","London bridge is falling down",
  "Pop goes the weasel today","Three blind mice run fast","Hey diddle diddle the cat",
  "Rain rain go away please","Twinkle twinkle little bright star","If you're happy clap hands",
  "This little piggy went home","Five little ducks went out","Pat a cake pat cake baker",
  "Ring around the rosie pocket","Jack be nimble jack quick","Georgie Porgie pudding and pie",
  "Little Bo Peep lost sheep","Mary Mary quite contrary garden","Peter Piper picked some peppers",
  "Sally sells seashells by seashore","There was an old woman shoe","Hush little baby don't cry",
  "Rock a bye baby in tree","I'm a little teapot short stout","Old King Cole was very merry",
  "Tom Tom the piper's son","Ladybug ladybug fly away home","Polly put the kettle on now",
  "Diddle diddle dumpling my son","Yankee Doodle went to town","Goosey goosey gander where wander",
  "Eensy weensy spider went up drain",
  // Song lyrics & titles
  "Happy birthday to you dear","We will rock you tonight hard","Don't stop believing hold on street",
  "All you need is love always","Imagine all the people living life","Sweet child of mine forever",
  "Smells like teen spirit come alive","Take me home to country roads","I want to break free now",
  "Somewhere over the rainbow bluebirds fly","Yesterday all my troubles seemed so far",
  "Hello darkness my old friend again","Like a rolling stone all alone","Born to be wild forever young",
  "Living on a prayer halfway there","I will always love you deeply","Walking on sunshine feels so great",
  "Don't worry be very happy now","Eye of the tiger rising up","We are the champions of world",
  "Hotel California such a lovely place","Sweet Caroline good times never seemed","American Pie drove my Chevy dry",
  "Hey there Delilah what's it like","Twist and shout shake it up baby","Yellow submarine we all live in",
  "Bohemian Rhapsody is just a poor boy","Somebody to love can anybody find me",
  // Common idioms & sayings
  "Break a leg out there tonight","Piece of cake easy as pie","Hit the nail right on head",
  "Cost an arm and a leg","Once in a blue moon maybe","Bite the bullet just do it",
  "Better late than never they say","Add fuel to the raging fire","Beat around the bush some more",
  "Curiosity killed the cat stone dead","Don't count your chickens too early","Cloud has a silver lining always",
  "Hit the books all through night","Kill two birds with one stone","Let sleeping dogs just lie quiet",
  "Make a long story very short","No pain no gain my friend","On thin ice young man now",
  "Pull yourself together right this instant","Speak of the devil himself appears","Take with a grain of salt",
  "A blessing in disguise for sure","Back to the drawing board again","Burn the midnight oil tonight",
  "Cut to the chase already please","Don't judge a book by cover","Get your act together right now",
  "Hang in there it gets better","When pigs fly over the rainbow","Out of the blue it happened",
  "Practice makes perfect they all say","Time is money so spend wisely","Two peas in a pod together",
  "You can't have it all always","The early bird catches the worm","Actions speak louder than words always",
  // Movie quotes
  "May the force be with you","Here's looking at you kid always","Houston we have a problem here",
  "Why so serious my friend tell","You can't handle the whole truth","Show me the money right now",
  "Life is like a box chocolates","Go ahead and make my day","Nobody puts baby in the corner",
  "I'm gonna make him an offer","Bond James Bond secret agent man","Wax on wax off grasshopper",
  "Run Forrest run as fast can","Stupid is as stupid always does","I'll have what she is having",
  "Toto we're not in Kansas anymore","I see dead people all the time","My precious my precious yes mine",
  "You shall not pass through here","I love you three thousand times over","I am Iron Man yes indeed",
  "We're going to need a bigger boat","Just keep swimming just keep going","To infinity and beyond Buzz Lightyear",
  // Tongue twisters
  "She sells seashells by the seashore","How much wood would a woodchuck chuck",
  "Red leather yellow leather red leather","Unique New York unique New York unique",
  "Toy boat toy boat toy boat toy","Irish wristwatch Swiss wristwatch hard say",
  "Six slick slim sycamore saplings stand","Fresh fried fish fish fresh fried","Black bug bit a big black bear",
  "Crisp crusts crackle and crunch loudly","Friendly fleas and fireflies freely fly","I scream you scream we all scream",
  // Famous quotes
  "I think therefore I am certain","To be or not to be question","A penny saved is penny earned",
  "Be the change you want see","Stay hungry and stay foolish always","Life is short eat the dessert",
  "Carpe diem seize the whole day","Fortune favors the truly brave ones","Quality over quantity always wins out",
  // Fun random phrases
  "Pizza for breakfast lunch and dinner","Dancing in the kitchen tonight alone","My cat ate all my homework again",
  "Squirrels running all around the yard","Pancakes with maple syrup this morning","Ice cream melts fast in summer heat",
  "Birthday cake with rainbow frosting please","Bubble gum stuck right in my hair","Marshmallows roasting on the open fire",
  "French fries with extra ketchup today","Hot dogs at the baseball park now","Popcorn at the movie theater tonight",
  "Cotton candy at the county fair","Donuts with rainbow sprinkles for breakfast","Camping under the very bright stars tonight",
  "Roasting marshmallows over the campfire flames","Hiking up the steep and rocky mountain","Swimming in the cool refreshing lake today",
  "Building sandcastles down at the beach","Watching sunset over the calm ocean water","Dolphins jumping high in the crashing waves",
  // Tech & modern
  "Have you tried turning it off","It works perfectly on my machine","Did you read the documentation first",
  "There's a great app just for that","Just google it real quick please","Send me the link when you can",
  "My WiFi connection is so slow","Charging my old phone right now","Battery is almost completely dead help",
  "Check your email for confirmation please","Update available please restart your device","Password is not nearly strong enough now",
  "Two factor authentication is enabled now","Smash that like button for me please","Like comment share and subscribe today",
  // Weather & seasons
  "Rainy days and Mondays always depress","Sunshine warming up my shoulders today","Snowflakes are falling on my window",
  "Thunder rolling across the dark sky","Lightning flashing right through dark clouds","Wind howling all through the bare trees",
  "Fog is rolling in from sea","Hailstorm pounding hard on the roof","Hurricane heading toward the eastern coastline",
  "Blizzard blanketing the entire small town","Earthquake shaking the entire tall building","Aurora dancing beautifully in the night sky",
  // Sports & games
  "Home run hit right out of park","Touchdown scored in the final few seconds","Slam dunk right over the defender",
  "Hat trick scored in just one game","Hole in one on the green","Knockout punch landed in third round",
  "Game set and match it is","Three strikes and you are completely out","Buzzer beater shot wins the whole game",
  "Penalty kick scored in extra time","Checkmate in just three more moves","Bingo I finally won the big prize",
];

// Backwards-compatible alias so old code still works
const PHRASES = PHRASES_PRO;

// Master map by level key
const PHRASE_SETS = {
  easy:   PHRASES_EASY,
  medium: PHRASES_MEDIUM,
  hard:   PHRASES_HARD,
  pro:    PHRASES_PRO,
};