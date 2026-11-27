// Pronunciation guides (romanization) and grammar tips.
// Not yet reviewed by native speakers: included in `node scripts/export-content.js`.

/* ---------- Japanese: kana -> romaji (Hepburn-style, long vowels written out) ---------- */

const KANA = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', ゔ: 'vu',
  '？': '?', '！': '!', '、': ',', '。': '.',
};
const SMALL_Y = { ゃ: 'a', ゅ: 'u', ょ: 'o' };
const SMALL_V = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o' };
const PARTICLES = { は: 'wa', を: 'o', が: 'ga', に: 'ni', で: 'de', の: 'no' };
// Words that end in a particle-like kana but aren't particles, and set readings
const WHOLE_WORDS = new Set(['しんぱいしないで', 'えいが', 'とても', 'はは', 'あに', 'こんにちは', 'こんばんは']);
const READINGS = { こんにちは: 'konnichiwa', こんばんは: 'konbanwa' };
const hasKana = (s) => /[぀-ヿ]/.test(s);
const toHira = (s) => [...s].map((c) => { const k = c.charCodeAt(0); return k >= 0x30a1 && k <= 0x30f6 ? String.fromCharCode(k - 0x60) : c; }).join('');

function kanaWord(w) {
  let out = '';
  let double = false;
  for (const c of toHira(w)) {
    if (c === 'っ') { double = true; continue; }
    if (c === 'ー') { const v = out.match(/[aeiou]$/); if (v) out += v[0]; continue; }
    if (SMALL_Y[c] && out) { out = (/(sh|ch|j)i$/.test(out) ? out.slice(0, -1) : out.replace(/i$/, 'y')) + SMALL_Y[c]; continue; }
    if (SMALL_V[c] && /[aeiou]$/.test(out)) { out = out.slice(0, -1) + SMALL_V[c]; continue; }
    let r = KANA[c] ?? c;
    if (double && /^[a-z]/.test(r)) r = (r.startsWith('ch') ? 't' : r[0]) + r;
    double = false;
    out += r;
  }
  return out;
}

export function kanaToRomaji(text) {
  return text.split(' ').map((tok) => {
    const punct = tok.match(/[？！、。]+$/)?.[0] || '';
    let w = punct ? tok.slice(0, -punct.length) : tok;
    let tail = '';
    const last = w.slice(-1);
    if (w.length > 1 && PARTICLES[last] && !WHOLE_WORDS.has(w)) { tail = ' ' + PARTICLES[last]; w = w.slice(0, -1); }
    let r = (READINGS[w] || kanaWord(w)) + tail;
    r = r.replace(/([a-z])desu/g, '$1 desu').replace(/desuka/g, 'desu ka').replace(/masuka/g, 'masu ka').replace(/([a-z])kudasai/g, '$1 kudasai');
    return r + (punct ? kanaWord(punct) : '');
  }).join(' ');
}

/* ---------- Chinese (pinyin), Korean (Revised Romanization), Hindi (common romanization) ---------- */

export const ROMAN = {
  zh: {
    '你好吗？': 'nǐ hǎo ma?', '谢谢': 'xièxie', '早上好': 'zǎoshang hǎo', '我叫亚历克斯': 'wǒ jiào Yàlìkèsī', '水': 'shuǐ',
    '牛奶': 'niúnǎi', '面包': 'miànbāo', '咖啡': 'kāfēi', '我想要一杯咖啡': 'wǒ xiǎng yào yì bēi kāfēi', '好吃': 'hǎochī',
    '请买单': 'qǐng mǎidān', '水很凉': 'shuǐ hěn liáng', '苹果': 'píngguǒ', '橙子': 'chéngzi', '奶酪': 'nǎilào',
    '火车站在哪里？': 'huǒchēzhàn zài nǎlǐ?', '左边': 'zuǒbian', '打扰一下': 'dǎrǎo yíxià', '我需要一张票': 'wǒ xūyào yì zhāng piào',
    '机场': 'jīchǎng', '火车站': 'huǒchēzhàn', '酒店': 'jiǔdiàn', '海滩': 'hǎitān', '很高兴认识你': 'hěn gāoxìng rènshi nǐ',
    '会议': 'huìyì', '明天见': 'míngtiān jiàn', '我在办公室工作': 'wǒ zài bàngōngshì gōngzuò', '办公室': 'bàngōngshì',
    '电脑': 'diànnǎo', '键盘': 'jiànpán', '电话': 'diànhuà', '这是我的妈妈': 'zhè shì wǒ de māma', '狗': 'gǒu', '我爱你': 'wǒ ài nǐ',
    '我哥哥很高': 'wǒ gēge hěn gāo', '朋友': 'péngyou', '哥哥': 'gēge', '爸爸': 'bàba', '猫': 'māo',
    '这个多少钱？': 'zhège duōshao qián?', '便宜': 'piányi', '我只是看看': 'wǒ zhǐshì kànkan', '我想付钱': 'wǒ xiǎng fù qián',
    '商店': 'shāngdiàn', '钱': 'qián', '包': 'bāo', '价格': 'jiàgé', '今天很热': 'jīntiān hěn rè', '雨': 'yǔ',
    '现在几点？': 'xiànzài jǐ diǎn?', '天气很好': 'tiānqì hěn hǎo', '今天': 'jīntiān', '明天': 'míngtiān', '太阳': 'tàiyáng', '冷': 'lěng',
    '我喜欢看书': 'wǒ xǐhuan kàn shū', '音乐': 'yīnyuè', '你踢足球吗？': 'nǐ tī zúqiú ma?', '我们去电影院': 'wǒmen qù diànyǐngyuàn',
    '书': 'shū', '歌': 'gē', '公园': 'gōngyuán', '电影': 'diànyǐng',
    '你好': 'nǐ hǎo', '再见': 'zàijiàn', '请': 'qǐng', '是': 'shì', '不': 'bù', '对不起': 'duìbuqǐ', '右边': 'yòubian', '票': 'piào',
    '邮件': 'yóujiàn', '老板': 'lǎobǎn', '妈妈': 'māma', '姐姐': 'jiějie', '贵': 'guì', '热': 'rè', '足球': 'zúqiú',
    // grammar tip examples
    '你忙吗？': 'nǐ máng ma?', '两杯茶': 'liǎng bēi chá', '酒店在哪里？': 'jiǔdiàn zài nǎlǐ?', '我在家工作': 'wǒ zài jiā gōngzuò',
    '这是我的朋友': 'zhè shì wǒ de péngyou', '苹果多少钱？': 'píngguǒ duōshao qián?', '今天很冷': 'jīntiān hěn lěng', '我喜欢听音乐': 'wǒ xǐhuan tīng yīnyuè',
  },
  ko: {
    '어떻게 지내요?': 'eotteoke jinaeyo?', '감사합니다': 'gamsahamnida', '좋은 아침이에요': 'joeun achimieyo', '제 이름은 알렉스예요': 'je ireumeun allekseuyeyo',
    '물': 'mul', '우유': 'uyu', '빵': 'ppang', '커피': 'keopi', '커피 한 잔 주세요': 'keopi han jan juseyo', '맛있어요': 'masisseoyo',
    '계산서 주세요': 'gyesanseo juseyo', '물이 차가워요': 'muri chagawoyo', '사과': 'sagwa', '오렌지': 'orenji', '치즈': 'chijeu',
    '역이 어디예요?': 'yeogi eodiyeyo?', '왼쪽': 'oenjjok', '실례합니다': 'sillyehamnida', '표가 필요해요': 'pyoga piryohaeyo', '공항': 'gonghang',
    '역': 'yeok', '호텔': 'hotel', '해변': 'haebyeon', '만나서 반가워요': 'mannaseo bangawoyo', '회의': 'hoeui', '내일 봐요': 'naeil bwayo',
    '저는 사무실에서 일해요': 'jeoneun samusireseo ilhaeyo', '사무실': 'samusil', '컴퓨터': 'keompyuteo', '키보드': 'kibodeu', '전화': 'jeonhwa',
    '이분은 제 어머니예요': 'ibuneun je eomeoniyeyo', '개': 'gae', '사랑해요': 'saranghaeyo', '제 형은 키가 커요': 'je hyeongeun kiga keoyo',
    '제 오빠는 키가 커요': 'je oppaneun kiga keoyo', '친구': 'chingu', '형': 'hyeong', '오빠': 'oppa', '누나': 'nuna', '언니': 'eonni',
    '아버지': 'abeoji', '고양이': 'goyangi', '이거 얼마예요?': 'igeo eolmayeyo?', '싸요': 'ssayo', '그냥 구경하고 있어요': 'geunyang gugyeonghago isseoyo',
    '계산할게요': 'gyesanhalgeyo', '가게': 'gage', '돈': 'don', '가방': 'gabang', '가격': 'gagyeok', '오늘 정말 더워요': 'oneul jeongmal deowoyo',
    '비': 'bi', '지금 몇 시예요?': 'jigeum myeot siyeyo?', '날씨가 좋아요': 'nalssiga joayo', '오늘': 'oneul', '내일': 'naeil', '해': 'hae',
    '추워요': 'chuwoyo', '더워요': 'deowoyo', '저는 책 읽는 것을 좋아해요': 'jeoneun chaek ingneun geoseul joahaeyo', '음악': 'eumak',
    '축구 해요?': 'chukgu haeyo?', '우리는 영화관에 가요': 'urineun yeonghwagwane gayo', '책': 'chaek', '노래': 'norae', '공원': 'gongwon', '영화': 'yeonghwa',
    '안녕하세요': 'annyeonghaseyo', '안녕히 가세요': 'annyeonghi gaseyo', '부탁해요': 'butakaeyo', '네': 'ne', '아니요': 'aniyo', '죄송해요': 'joesonghaeyo',
    '표': 'pyo', '오른쪽': 'oreunjjok', '이메일': 'imeil', '상사': 'sangsa', '어머니': 'eomeoni', '비싸요': 'bissayo', '축구': 'chukgu',
    // grammar tip examples
    '고마워요': 'gomawoyo', '물 주세요': 'mul juseyo', '호텔이 어디예요?': 'hoteri eodiyeyo?', '집에서 일해요': 'jibeseo ilhaeyo',
    '저는 학생이에요': 'jeoneun haksaengieyo', '사과 얼마예요?': 'sagwa eolmayeyo?', '오늘 추워요': 'oneul chuwoyo', '음악을 좋아해요': 'eumageul joahaeyo',
  },
  hi: {
    'आप कैसे हैं?': 'aap kaise hain?', 'धन्यवाद': 'dhanyavaad', 'सुप्रभात': 'suprabhaat', 'मेरा नाम एलेक्स है': 'mera naam Alex hai', 'पानी': 'paani',
    'दूध': 'doodh', 'रोटी': 'roti', 'कॉफ़ी': 'kofi', 'मुझे एक कॉफ़ी चाहिए': 'mujhe ek kofi chaahiye', 'स्वादिष्ट': 'svaadisht', 'बिल दीजिए': 'bil deejiye',
    'पानी ठंडा है': 'paani thanda hai', 'सेब': 'seb', 'संतरा': 'santara', 'पनीर': 'paneer', 'स्टेशन कहाँ है?': 'steshan kahaan hai?', 'बाएँ': 'baayen',
    'माफ़ कीजिए': 'maaf keejiye', 'मुझे एक टिकट चाहिए': 'mujhe ek tikat chaahiye', 'हवाई अड्डा': 'havaai adda', 'स्टेशन': 'steshan', 'होटल': 'hotal',
    'समुद्र तट': 'samudra tat', 'आपसे मिलकर ख़ुशी हुई': 'aapse milkar khushi hui', 'बैठक': 'baithak', 'कल मिलते हैं': 'kal milte hain',
    'मैं एक दफ़्तर में काम करता हूँ': 'main ek daftar mein kaam karta hoon', 'मैं एक दफ़्तर में काम करती हूँ': 'main ek daftar mein kaam karti hoon',
    'दफ़्तर': 'daftar', 'कंप्यूटर': 'kampyootar', 'कीबोर्ड': 'keeboard', 'फ़ोन': 'fon', 'ये मेरी माँ हैं': 'ye meri maan hain', 'कुत्ता': 'kutta',
    'मैं तुमसे प्यार करता हूँ': 'main tumse pyaar karta hoon', 'मैं तुमसे प्यार करती हूँ': 'main tumse pyaar karti hoon', 'मेरा भाई लंबा है': 'mera bhaai lamba hai',
    'दोस्त': 'dost', 'भाई': 'bhaai', 'पिता': 'pita', 'बिल्ली': 'billi', 'यह कितने का है?': 'yah kitne ka hai?', 'सस्ता': 'sasta',
    'मैं बस देख रहा हूँ': 'main bas dekh raha hoon', 'मैं बस देख रही हूँ': 'main bas dekh rahi hoon',
    'मैं पैसे देना चाहता हूँ': 'main paise dena chaahta hoon', 'मैं पैसे देना चाहती हूँ': 'main paise dena chaahti hoon',
    'दुकान': 'dukaan', 'पैसा': 'paisa', 'थैला': 'thaila', 'दाम': 'daam', 'आज बहुत गर्मी है': 'aaj bahut garmi hai', 'बारिश': 'baarish',
    'कितने बजे हैं?': 'kitne baje hain?', 'मौसम अच्छा है': 'mausam achchha hai', 'आज': 'aaj', 'कल': 'kal', 'सूरज': 'sooraj', 'ठंडा': 'thanda',
    'मुझे पढ़ना पसंद है': 'mujhe padhna pasand hai', 'संगीत': 'sangeet', 'क्या तुम फ़ुटबॉल खेलते हो?': 'kya tum futbol khelte ho?',
    'हम सिनेमा जाते हैं': 'ham sinema jaate hain', 'किताब': 'kitaab', 'गाना': 'gaana', 'पार्क': 'paark', 'फ़िल्म': 'film',
    'नमस्ते': 'namaste', 'अलविदा': 'alvida', 'कृपया': 'kripya', 'हाँ': 'haan', 'नहीं': 'nahin', 'दाएँ': 'daayen', 'टिकट': 'tikat',
    'ईमेल': 'eemel', 'बॉस': 'bos', 'माँ': 'maan', 'बहन': 'bahan', 'महँगा': 'mahanga', 'गर्म': 'garm', 'फ़ुटबॉल': 'futbol',
    // grammar tip examples
    'तुम कैसे हो?': 'tum kaise ho?', 'मुझे पानी चाहिए': 'mujhe paani chaahiye', 'होटल कहाँ है?': 'hotal kahaan hai?', 'वह घर से काम करती है': 'vah ghar se kaam karti hai',
    'मेरी बहन लंबी है': 'meri bahan lambi hai', 'यह किताब कितने की है?': 'yah kitaab kitne ki hai?', 'कल बारिश होगी': 'kal baarish hogi', 'मुझे संगीत पसंद है': 'mujhe sangeet pasand hai',
  },
};

export const GUIDE_LANGS = ['ja', 'zh', 'ko', 'hi'];

// The pronunciation guide for a phrase, or null (Latin-script languages, English text, unknown phrases)
export function romanOf(lang, text) {
  if (!text) return null;
  if (lang === 'ja') return hasKana(text) ? kanaToRomaji(text) : null;
  if (lang === 'ru') return /[а-яё]/i.test(text) ? cyrillicToLatin(text) : null;
  return ROMAN[lang]?.[text] || null;
}

/* ---------- Grammar tips: [title, explanation, example, example in English], one per unit ---------- */

export const TIPS = {
  es: [
    ['Formal and informal “you”', '“¿Cómo estás?” uses tú, for friends and family. With strangers, older people or at work, use usted and drop the -s: “¿Cómo está?”.', '¿Cómo está usted?', 'How are you? (formal)'],
    ['“Quisiera”: polite wanting', '“Quisiera” (I would like) sounds softer than “quiero” (I want). It is the usual way to order in a café.', 'Quisiera un té', 'I would like a tea'],
    ['“Estar” for where things are', 'Use estar, not ser, to say where something is: “¿Dónde está…?” and “Está aquí”.', 'El hotel está aquí', 'The hotel is here'],
    ['Present tense of -ar verbs', 'Drop -ar and add the ending: trabajar → trabajo (I work), trabajas (you work), trabaja (he/she works).', 'Ella trabaja en casa', 'She works at home'],
    ['Nouns have a gender', 'Every noun is masculine or feminine, and the article and adjective match it: el hermano alto, la hermana alta.', 'Mi hermana es alta', 'My sister is tall'],
    ['“Cuesta” or “cuestan”', 'Use cuesta for one thing and cuestan for more than one.', '¿Cuánto cuestan las manzanas?', 'How much are the apples?'],
    ['“Hace” for weather', 'Spanish says the weather “makes” heat: hace calor, hace frío, hace sol. For rain, say “llueve”.', 'Hace frío hoy', 'It is cold today'],
    ['“Me gusta” and “me gustan”', '“Me gusta” means “it pleases me”. Use gusta with a verb or one thing, and gustan with several things.', 'Me gustan los libros', 'I like books'],
  ],
  fr: [
    ['“Tu” and “vous”', '“Comment ça va ?” is casual. With strangers, at work or with older people, say “Comment allez-vous ?”.', 'Comment allez-vous ?', 'How are you? (formal)'],
    ['“Je voudrais”: polite ordering', '“Je voudrais” (I would like) comes from vouloir. It is more polite than “je veux”.', 'Je voudrais un thé', 'I would like a tea'],
    ['Left and right', 'Use “à” for directions: à gauche (on the left), à droite (on the right), tout droit (straight on).', 'La gare est à gauche', 'The station is on the left'],
    ['Present tense of -er verbs', 'travailler → je travaille, tu travailles, il travaille. These three forms all sound the same.', 'Elle travaille à la maison', 'She works at home'],
    ['“Mon”, “ma”, “mes”', '“My” matches the noun: mon frère (masculine), ma mère (feminine), mes parents (plural).', 'Ma sœur est grande', 'My sister is tall'],
    ['Asking the price', '“Combien ça coûte ?” and “C’est combien ?” both mean “How much is it?”. The second is very common in shops.', 'C’est combien ?', 'How much is it?'],
    ['“Il fait…” for weather', 'Most weather uses il fait: il fait chaud, il fait froid, il fait beau. Rain is different: il pleut.', 'Il pleut aujourd’hui', 'It is raining today'],
    ['“J’aime” + verb', 'Put the verb straight after aimer: j’aime lire, j’aime nager. For “I don’t like”, wrap it in ne… pas.', 'Je n’aime pas courir', 'I don’t like running'],
  ],
  ja: [
    ['です makes it polite', 'Ending a sentence with です (desu) makes it polite. わたしは アレックスです means “As for me, I’m Alex”.', 'がくせいです', 'I am a student'],
    ['Asking for things', 'Say the thing, then を ください (o kudasai) to ask for it politely.', 'みずを ください', 'Water, please'],
    ['は and どこ', 'X は どこですか？ means “Where is X?”. は marks the topic; it is written “ha” but said “wa”.', 'トイレは どこですか？', 'Where is the toilet?'],
    ['で: where you do something', 'で (de) marks the place where an action happens: オフィスで はたらきます (I work at the office).', 'うちで はたらきます', 'I work at home'],
    ['Family words change', 'Talking about your own family uses humble words (はは, my mother). For someone else’s family, use polite words (おかあさん).', 'おかあさんは げんきですか？', 'Is your mother well?'],
    ['これ, それ, あれ', 'これ is this (near me), それ is that (near you), あれ is that over there.', 'それは いくらですか？', 'How much is that?'],
    ['い-adjectives', 'Adjectives like あつい, さむい and たかい end in い and can finish a sentence with です. For the past, change い to かった.', 'きのうは さむかったです', 'It was cold yesterday'],
    ['が すきです: I like', 'X が すきです means “I like X”. The thing you like comes first.', 'おんがくが すきです', 'I like music'],
  ],
  de: [
    ['“Du” and “Sie”', '“Wie geht es dir?” is informal. With strangers and at work, use Sie: “Wie geht es Ihnen?”.', 'Wie geht es Ihnen?', 'How are you? (formal)'],
    ['“Ich hätte gern”', 'This is the polite way to order. “Einen Kaffee” uses einen because Kaffee is masculine and the object of the sentence.', 'Ich hätte gern ein Wasser', 'I would like a water'],
    ['der, die, das', 'Every noun has a gender: der Bahnhof, die Fahrkarte, das Hotel. Learn the article together with the word.', 'Wo ist das Hotel?', 'Where is the hotel?'],
    ['The verb comes second', 'In a statement the verb is always the second idea. If you start with another word, the subject moves after the verb.', 'Morgen arbeite ich zu Hause', 'Tomorrow I work at home'],
    ['“mein” and “meine”', '“My” matches the noun: mein Bruder (masculine), meine Mutter (feminine).', 'Meine Schwester ist groß', 'My sister is tall'],
    ['“Ich möchte…”', 'Möchte (would like) sends the second verb to the end of the sentence: Ich möchte bezahlen.', 'Ich möchte das kaufen', 'I would like to buy that'],
    ['Talking about the weather', 'Use es: Es ist kalt, es ist heiß. Rain is a verb: Es regnet.', 'Es regnet heute', 'It is raining today'],
    ['“gern” for liking', 'Add gern after the verb to say you like doing it: Ich lese gern. Not liking it: nicht gern.', 'Ich schwimme nicht gern', 'I don’t like swimming'],
  ],
  ko: [
    ['Polite -요 endings', 'Ending with -요 (yo) is polite but friendly, right for most conversations: 지내요, 고마워요.', '고마워요', 'Thank you (polite)'],
    ['주세요: please give me', 'Say the thing, then 주세요 (juseyo), to ask for it.', '물 주세요', 'Water, please'],
    ['Subject marker 이/가', 'Use 이 after a consonant (역이) and 가 after a vowel (표가).', '호텔이 어디예요?', 'Where is the hotel?'],
    ['에서: where you do something', '에서 (eseo) marks the place where an action happens: 사무실에서 일해요 (I work at the office).', '집에서 일해요', 'I work at home'],
    ['Topic marker 은/는', 'Use 은 after a consonant and 는 after a vowel: 저는 (as for me), 형은 (as for my brother).', '저는 학생이에요', 'I am a student'],
    ['Asking the price', '얼마예요? means “How much is it?”. Put the item first: 사과 얼마예요?', '사과 얼마예요?', 'How much are the apples?'],
    ['Adjectives work like verbs', 'Korean adjectives are full sentences on their own: 더워요 (it’s hot), 추워요 (it’s cold).', '오늘 추워요', 'It is cold today'],
    ['좋아해요: to like', 'Thing + 을/를 + 좋아해요. Use 을 after a consonant and 를 after a vowel.', '음악을 좋아해요', 'I like music'],
  ],
  zh: [
    ['吗 makes a question', 'Add 吗 (ma) to the end of a statement to turn it into a yes/no question.', '你忙吗？', 'Are you busy?'],
    ['Measure words', 'Numbers need a measure word before the noun: 一杯咖啡 (a cup of coffee), 一个苹果 (an apple).', '两杯茶', 'Two cups of tea'],
    ['在 for where things are', 'X 在哪里？ means “Where is X?”. 在 (zài) means “is at”.', '酒店在哪里？', 'Where is the hotel?'],
    ['Place before the verb', 'Say where you do something before the verb: 我在家工作 (I at home work).', '我在家工作', 'I work at home'],
    ['的 for “my”', '我的 means “my”. With close family and friends you can leave out 的: 我妈妈.', '这是我的朋友', 'This is my friend'],
    ['多少钱: how much', '多少钱？ means “how much money?”. Put the item first: 这个多少钱？', '苹果多少钱？', 'How much are the apples?'],
    ['很 with adjectives', 'Chinese links a subject to an adjective with 很 (hěn) instead of “is”: 今天很热.', '今天很冷', 'It is cold today'],
    ['喜欢: to like', '喜欢 (xǐhuan) can take a noun or a verb: 我喜欢书, 我喜欢看书.', '我喜欢听音乐', 'I like listening to music'],
  ],
  it: [
    ['“Tu” and “Lei”', '“Come stai?” is informal. With strangers, use Lei and the verb form for he/she: “Come sta?”.', 'Come sta?', 'How are you? (formal)'],
    ['“Vorrei”: polite ordering', '“Vorrei” (I would like) comes from volere. It is the usual way to order.', 'Vorrei un tè', 'I would like a tea'],
    ['“Dov’è…?”', 'Dove + è shortens to dov’è (where is). For several things: dove sono?', 'Dov’è l’albergo?', 'Where is the hotel?'],
    ['Present tense of -are verbs', 'lavorare → lavoro (I work), lavori (you work), lavora (he/she works).', 'Lei lavora a casa', 'She works at home'],
    ['No article with one relative', 'With a single family member, “my” needs no article: mia madre. With plurals it does: le mie sorelle.', 'Mia sorella è alta', 'My sister is tall'],
    ['“Costa” or “costano”', 'Use costa for one thing and costano for more than one.', 'Quanto costano le mele?', 'How much are the apples?'],
    ['“Fa” for weather', 'Italian uses fare: fa caldo, fa freddo, fa bel tempo. Rain is a verb: piove.', 'Oggi piove', 'It is raining today'],
    ['“Mi piace” and “mi piacciono”', 'Use piace with a verb or one thing, and piacciono with several things.', 'Mi piacciono i libri', 'I like books'],
  ],
  hi: [
    ['आप and तुम', 'आप (aap) is respectful: use it with strangers and elders. तुम (tum) is for friends.', 'तुम कैसे हो?', 'How are you? (informal)'],
    ['मुझे … चाहिए: I want', 'मुझे … चाहिए literally means “to me … is needed”. It is the everyday way to ask for something.', 'मुझे पानी चाहिए', 'I want water'],
    ['The verb comes last', 'Hindi puts the verb at the end: होटल कहाँ है? is “Hotel where is?”.', 'होटल कहाँ है?', 'Where is the hotel?'],
    ['Verbs follow gender', 'Many verbs change with the speaker’s or subject’s gender: करता हूँ (male), करती हूँ (female).', 'वह घर से काम करती है', 'She works from home'],
    ['मेरा, मेरी, मेरे', '“My” matches what you own: मेरा भाई (my brother), मेरी माँ (my mother), मेरे दोस्त (my friends).', 'मेरी बहन लंबी है', 'My sister is tall'],
    ['Asking the price', 'यह कितने का है? means “How much is this?”. For a feminine noun, use की: यह किताब कितने की है?', 'यह किताब कितने की है?', 'How much is this book?'],
    ['कल: yesterday or tomorrow', 'कल (kal) means both. The verb’s tense tells you which one.', 'कल बारिश होगी', 'It will rain tomorrow'],
    ['पसंद है: I like', 'मुझे … पसंद है literally means “to me … is liked”.', 'मुझे संगीत पसंद है', 'I like music'],
  ],
  pt: [
    ['Being polite', 'In Portugal tu is common with friends. With strangers, use the verb form for he/she: “Como está?”.', 'Como está?', 'How are you? (polite)'],
    ['“Queria”: polite ordering', 'In Portugal, “Queria…” (I would like) is the usual polite way to ask for something.', 'Queria um chá', 'I would like a tea'],
    ['“Onde fica…?”', 'Use “onde fica” for places that don’t move, like buildings. Use “onde está” for people and objects.', 'Onde fica o hotel?', 'Where is the hotel?'],
    ['Present tense of -ar verbs', 'trabalhar → trabalho (I work), trabalhas (you work), trabalha (he/she works).', 'Ela trabalha em casa', 'She works at home'],
    ['“O meu”, “a minha”', 'In European Portuguese, “my” usually comes with an article: o meu irmão, a minha mãe.', 'A minha irmã é alta', 'My sister is tall'],
    ['“Custa” or “custam”', 'Use custa for one thing and custam for more than one.', 'Quanto custam as maçãs?', 'How much are the apples?'],
    ['“Está” for weather', 'Use estar: está calor, está frio, está bom tempo. Rain is a verb: chove.', 'Hoje chove', 'It is raining today'],
    ['“Gostar de”', 'Gostar always takes de, which joins with the article: gosto de ler, gosto do livro (de + o).', 'Gosto de música', 'I like music'],
  ],
  nl: [
    ['“Je” and “u”', '“Hoe gaat het?” works with anyone. To be formal, add “met u”: “Hoe gaat het met u?”.', 'Hoe gaat het met u?', 'How are you? (formal)'],
    ['Asking politely', 'Graag makes a request polite: “Ik wil graag…”. You can also ask “Mag ik…?” (May I have…?).', 'Mag ik een thee?', 'May I have a tea?'],
    ['“De” and “het”', 'Nouns take de or het: de trein, het station. Learn the article with each word.', 'Waar is de trein?', 'Where is the train?'],
    ['The verb comes second', 'In a statement the verb is the second idea. Start with another word and the subject moves after the verb.', 'Morgen werk ik thuis', 'Tomorrow I work at home'],
    ['“Mijn” never changes', 'Dutch “my” is always mijn: mijn moeder, mijn broer, mijn ouders.', 'Mijn zus is lang', 'My sister is tall'],
    ['“Kost” or “kosten”', 'Use kost for one thing and kosten for more than one.', 'Hoeveel kosten de appels?', 'How much are the apples?'],
    ['Talking about the weather', 'Use het: Het is warm, het is koud. Rain is a verb: Het regent.', 'Het regent vandaag', 'It is raining today'],
    ['“Graag” for liking', 'Put graag after the verb to say you like doing it: Ik lees graag. Not liking it: niet graag.', 'Ik zwem niet graag', 'I don’t like swimming'],
  ],
};

/* ---------- Russian: Cyrillic -> Latin (simple, readable transliteration) ---------- */

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};
const RU_VOWELS = 'аеёиоуыэюяьъ';
export function cyrillicToLatin(text) {
  let out = '';
  const chars = [...text];
  chars.forEach((c, i) => {
    const lower = c.toLowerCase();
    let r = CYR[lower];
    if (r === undefined) { out += c; return; }
    // е at the start of a word or after a vowel is said "ye"
    const prev = chars[i - 1]?.toLowerCase();
    if (lower === 'е' && (!prev || !/[а-яё]/.test(prev) || RU_VOWELS.includes(prev))) r = 'ye';
    out += c !== lower && r ? r[0].toUpperCase() + r.slice(1) : r;
  });
  return out;
}

Object.assign(ROMAN, {
  ar: {
    'كيف حالك؟': 'kayfa haaluk?', 'شكرا': 'shukran', 'صباح الخير': 'sabaah al-khayr', 'اسمي أليكس': 'ismi Aleks', 'ماء': "maa'",
    'حليب': 'haliib', 'خبز': 'khubz', 'قهوة': 'qahwa', 'أريد قهوة': 'uriid qahwa', 'لذيذ': 'ladhiidh', 'الحساب من فضلك': 'al-hisaab min fadlak',
    'الماء بارد': "al-maa' baarid", 'تفاحة': 'tuffaaha', 'برتقالة': 'burtuqaala', 'جبن': 'jubn', 'أين المحطة؟': 'ayna al-mahatta?', 'يسار': 'yasaar',
    'لو سمحت': 'law samaht', 'أحتاج تذكرة': 'ahtaaj tadhkira', 'مطار': 'mataar', 'محطة': 'mahatta', 'فندق': 'funduq', 'شاطئ': "shaati'",
    'تشرفنا': 'tasharrafnaa', 'اجتماع': "ijtimaa'", 'أراك غدا': 'araaka ghadan', 'أعمل في مكتب': "a'mal fii maktab", 'مكتب': 'maktab',
    'حاسوب': 'haasuub', 'لوحة مفاتيح': 'lawhat mafaatiih', 'هاتف': 'haatif', 'هذه أمي': 'haadhihi ummi', 'كلب': 'kalb', 'أحبك': 'uhibbuk',
    'أخي طويل': 'akhi tawiil', 'صديق': 'sadiiq', 'أخ': 'akh', 'أب': 'ab', 'قطة': 'qitta', 'بكم هذا؟': 'bikam haadhaa?', 'رخيص': 'rakhiis',
    'أنا أتفرج فقط': 'ana atafarraj faqat', 'أريد أن أدفع': "uriid an adfa'", 'متجر': 'matjar', 'نقود': 'nuquud', 'حقيبة': 'haqiiba', 'سعر': "si'r",
    'الجو حار جدا اليوم': 'al-jaw haar jiddan al-yawm', 'مطر': 'matar', 'كم الساعة؟': "kam as-saa'a?", 'الطقس جميل': 'at-taqs jamiil',
    'اليوم': 'al-yawm', 'غدا': 'ghadan', 'شمس': 'shams', 'بارد': 'baarid', 'أحب القراءة': "uhibb al-qiraa'a", 'موسيقى': 'muusiiqaa',
    'هل تلعب كرة القدم؟': "hal tal'ab kurat al-qadam?", 'نذهب إلى السينما': 'nadhhab ilaa as-siinamaa', 'كتاب': 'kitaab', 'أغنية': 'ughniya',
    'حديقة': 'hadiiqa', 'فيلم': 'film', 'مرحبا': 'marhaban', 'مع السلامة': "ma'a as-salaama", 'من فضلك': 'min fadlak', 'نعم': "na'am", 'لا': 'laa',
    'آسف': 'aasif', 'آسفة': 'aasifa', 'يمين': 'yamiin', 'بريد إلكتروني': 'bariid iliktruuni', 'مدير': 'mudiir', 'أم': 'umm', 'أخت': 'ukht',
    'غالي': 'ghaali', 'حار': 'haar', 'كرة القدم': 'kurat al-qadam', 'تذكرة': 'tadhkira',
    // grammar tip examples
    'مساء الخير': "masaa' al-khayr", 'أريد ماء من فضلك': "uriid maa' min fadlak", 'أين الفندق؟': 'ayna al-funduq?', 'أنا آسفة': 'ana aasifa',
    'أختي طويلة': 'ukhti tawiila', 'بكم التفاح؟': 'bikam at-tuffaah?', 'الجو بارد اليوم': 'al-jaw baarid al-yawm', 'أحب الموسيقى': 'uhibb al-muusiiqaa',
  },
});
GUIDE_LANGS.push('ru', 'ar');

Object.assign(TIPS, {
  ru: [
    ['“Ты” and “Вы”', '“Как дела?” is casual. With strangers or older people, ask “Как у вас дела?”, using the polite вы.', 'Как у вас дела?', 'How are you? (formal)'],
    ['“I would like” changes with gender', 'A man says “Я бы хотел”, a woman says “Я бы хотела”. Past-tense verbs change the same way.', 'Я бы хотела чай', 'I would like tea (woman speaking)'],
    ['“Где”: where', 'Где + place asks where something is. Russian needs no word for “is”.', 'Где гостиница?', 'Where is the hotel?'],
    ['Present tense', 'работать → я работаю (I work), ты работаешь (you work), она работает (she works).', 'Она работает дома', 'She works at home'],
    ['No “is” in the present', 'Russian leaves out “is”: Мой брат высокий is literally “My brother tall”. Adjectives match gender: высокий, высокая.', 'Моя сестра высокая', 'My sister is tall'],
    ['“Стоит” or “стоят”', 'Use стоит for one thing and стоят for several.', 'Сколько стоят яблоки?', 'How much are the apples?'],
    ['Talking about the weather', 'Weather often uses a single word: жарко (it’s hot), холодно (it’s cold). Rain “goes”: идёт дождь.', 'Сегодня идёт дождь', 'It is raining today'],
    ['“Люблю” + verb', 'Люблю (I like / love) + a verb in its basic form: я люблю читать.', 'Я люблю плавать', 'I like swimming'],
  ],
  ar: [
    ['Right to left', 'Arabic is written right to left, and most letters join the next one. Greetings often answer with the same words plus more.', 'مساء الخير', 'Good evening'],
    ['أريد: I want', 'أريد (uriid) + the thing you want. Add من فضلك (min fadlak) to be polite.', 'أريد ماء من فضلك', 'I want water, please'],
    ['أين: where', 'أين (ayna) + place. Arabic needs no word for “is” here.', 'أين الفندق؟', 'Where is the hotel?'],
    ['Speaking as a man or a woman', 'Some words change with the speaker: آسف (aasif) for a man, آسفة (aasifa) for a woman.', 'أنا آسفة', 'I am sorry (woman speaking)'],
    ['ـي for “my”', 'Add ـي (-ii) to a noun for “my”: أخ → أخي (my brother), أخت → أختي (my sister).', 'أختي طويلة', 'My sister is tall'],
    ['بكم: how much', 'بكم (bikam) means “for how much?”. Put the item after it.', 'بكم التفاح؟', 'How much are the apples?'],
    ['ال: the', 'ال (al-) means “the” and joins the word: يوم is “day”, اليوم is “today” (literally “the day”).', 'الجو بارد اليوم', 'It is cold today'],
    ['أحب: I love', 'أحب (uhibb) + a noun: أحب القراءة, “I love reading”.', 'أحب الموسيقى', 'I love music'],
  ],
  tr: [
    ['“Sen” and “siz”', '“Nasılsın?” is casual. To be polite, use the siz form: “Nasılsınız?”.', 'Nasılsınız?', 'How are you? (formal)'],
    ['“İstiyorum”: I want', 'Put the thing first, then istiyorum. Bir means “a” or “one”.', 'Bir çay istiyorum', 'I want a tea'],
    ['“Nerede”: where', 'Place + nerede? asks where something is.', 'Otel nerede?', 'Where is the hotel?'],
    ['The verb comes last', 'Turkish puts the verb at the end: Ofiste çalışıyorum is “office-in working-I”.', 'Evde çalışıyorum', 'I work at home'],
    ['Endings for “my”', 'Add -(i)m to a noun for “my”: anne → annem (my mother), kardeş → kardeşim.', 'Kız kardeşim uzun boylu', 'My sister is tall'],
    ['“Ne kadar”: how much', 'Item + ne kadar? asks the price.', 'Elmalar ne kadar?', 'How much are the apples?'],
    ['“Hava”: the weather', 'Use hava for weather: hava sıcak (it’s hot), hava soğuk (it’s cold).', 'Bugün hava soğuk', 'It is cold today'],
    ['“Severim”: I like', 'Verb + -mayı / -meyi + severim: okumayı severim, “I like reading”.', 'Yüzmeyi severim', 'I like swimming'],
  ],
  id: [
    ['Verbs never change', 'Indonesian verbs stay the same for everyone: saya makan, kamu makan, dia makan.', 'Saya baik-baik saja', 'I am fine'],
    ['“Mau”: want', 'Saya mau + the thing you want. Add ya at the end to sound friendlier.', 'Saya mau teh', 'I want tea'],
    ['“Di mana”: where', 'Place + di mana? asks where something is. -nya works like “the”.', 'Hotelnya di mana?', 'Where is the hotel?'],
    ['“Di” for places', 'di + place means in or at: di kantor (at the office), di rumah (at home).', 'Saya bekerja di rumah', 'I work at home'],
    ['“My” comes after', 'The owner comes after the noun: ibu saya = my mother (literally “mother I”).', 'Kakak perempuan saya tinggi', 'My older sister is tall'],
    ['“Berapa”: how much', 'Berapa? asks how much or how many.', 'Apelnya berapa?', 'How much are the apples?'],
    ['“Sekali”: very', 'Put sekali after an adjective for “very”: panas sekali (very hot).', 'Hari ini dingin sekali', 'It is very cold today'],
    ['“Suka”: like', 'Saya suka + a verb or a noun.', 'Saya suka berenang', 'I like swimming'],
  ],
  sv: [
    ['One “you” for everyone', 'Swedish uses du with almost everyone, even strangers and your boss.', 'Hur är läget?', 'How’s it going?'],
    ['“Jag skulle vilja”', 'This is the polite way to say “I would like”. Add ha before a thing.', 'Jag skulle vilja ha ett te', 'I would like a tea'],
    ['“The” is an ending', 'Swedish adds “the” to the end of a noun: station → stationen, hotell → hotellet.', 'Var är hotellet?', 'Where is the hotel?'],
    ['The verb comes second', 'The verb is the second idea. Start with another word and the subject moves after the verb.', 'I morgon jobbar jag hemma', 'Tomorrow I work at home'],
    ['“Min”, “mitt”, “mina”', '“My” changes with the noun: min bror, mitt hus (my house), mina föräldrar (my parents).', 'Min syster är lång', 'My sister is tall'],
    ['Asking the price', 'Hur mycket kostar…? works for one thing or several.', 'Hur mycket kostar äpplena?', 'How much are the apples?'],
    ['“Det är…” for weather', 'Det är varmt (it’s warm), det är kallt (it’s cold). Rain is a verb: det regnar.', 'Det regnar i dag', 'It is raining today'],
    ['“Tycker om”: like', 'Tycker om + att + verb: jag tycker om att läsa.', 'Jag tycker om att simma', 'I like swimming'],
  ],
  pl: [
    ['“Ty” and “Pan/Pani”', '“Jak się masz?” is casual. To be polite, use Pan (to a man) or Pani (to a woman).', 'Jak się Pani ma?', 'How are you? (formal, to a woman)'],
    ['“Poproszę”: polite asking', 'Poproszę + the thing is the easiest polite way to order or ask for something.', 'Poproszę herbatę', 'A tea, please'],
    ['“Gdzie jest”: where is', 'Gdzie jest + place asks where something is.', 'Gdzie jest hotel?', 'Where is the hotel?'],
    ['Present tense', 'pracować → pracuję (I work), pracujesz (you work), pracuje (he/she works).', 'Ona pracuje w domu', 'She works at home'],
    ['“Mój”, “moja”, “moje”', '“My” matches the noun: mój brat, moja mama, moje dziecko (my child).', 'Moja siostra jest wysoka', 'My sister is tall'],
    ['“Kosztuje” or “kosztują”', 'Use kosztuje for one thing and kosztują for several.', 'Ile kosztują jabłka?', 'How much are the apples?'],
    ['Talking about the weather', 'Jest gorąco (it’s hot), jest zimno (it’s cold). Rain “falls”: pada deszcz.', 'Dzisiaj pada deszcz', 'It is raining today'],
    ['“Lubię” + verb', 'Lubię (I like) + a verb in its basic form.', 'Lubię pływać', 'I like swimming'],
  ],
});

export const tipFor = (lang, unit) => {
  const t = TIPS[lang]?.[unit];
  return t ? { title: t[0], body: t[1], example: t[2], meaning: t[3] } : null;
};

/* ---------- Units 9–12: tips and pronunciation guides ---------- */

const MORE_TIPS = {
  es: [
    ['“Hay”: there is, there are', 'Hay works for one thing or many: hay una cama (there is a bed), hay dos ventanas (there are two windows).', 'Hay una mesa en la cocina', 'There is a table in the kitchen'],
    ['“Me duele”: it hurts', 'Spanish says the body part hurts you: me duele la cabeza (my head hurts). Use duelen for more than one: me duelen los pies.', 'Me duele la mano', 'My hand hurts'],
    ['Reflexive verbs', 'Routine verbs often take me, te, se: levantarse → me levanto (I get up), acostarse → me acuesto (I go to bed).', 'Me ducho por la mañana', 'I shower in the morning'],
    ['“Estar” for feelings', 'Feelings use estar, because they change: está cansado (he is tired), estoy triste (I am sad).', 'Mi hermano está cansado', 'My brother is tired'],
  ],
  fr: [
    ['“Il y a”: there is', 'Il y a works for one thing or many: il y a un lit, il y a deux fenêtres.', 'Il y a une table dans la cuisine', 'There is a table in the kitchen'],
    ['“Avoir mal à”', 'To say something hurts, use avoir mal à + body part: j’ai mal à la tête (head), j’ai mal au dos (back).', 'J’ai mal à la main', 'My hand hurts'],
    ['Reflexive verbs', 'Routine verbs take me, te, se: se lever → je me lève (I get up), se coucher → je me couche (I go to bed).', 'Je me douche le matin', 'I shower in the morning'],
    ['Adjectives match the person', 'Adjectives change for a woman, often by adding -e: fatigué → fatiguée. Some change more: heureux → heureuse.', 'Elle est fatiguée', 'She is tired'],
  ],
  ja: [
    ['あります and います', 'Use あります for things and います for people and animals: いすが あります (there is a chair), ねこが います (there is a cat).', 'へやに ねこが います', 'There is a cat in the room'],
    ['いたい: it hurts', 'Body part + が + いたいです says something hurts: あたまが いたいです (I have a headache).', 'てが いたいです', 'My hand hurts'],
    ['Time + に', 'Put に after a clock time: しちじに (at seven). Verbs ending in ます are polite and cover both now and later.', 'わたしは じゅうじに ねます', 'I go to bed at ten'],
    ['Feelings with です', 'Add です to an い-adjective to sound polite: うれしい → うれしいです (I am happy).', 'とても かなしいです', 'I am very sad'],
  ],
  de: [
    ['“Es gibt”: there is', 'Es gibt works for one thing or many: es gibt einen Tisch, es gibt zwei Fenster.', 'Es gibt einen Stuhl in der Küche', 'There is a chair in the kitchen'],
    ['Compound nouns', 'German joins words into one: Kopf (head) + Schmerzen (pain) = Kopfschmerzen. Bauch (stomach) → Bauchschmerzen.', 'Ich habe Bauchschmerzen', 'I have a stomach ache'],
    ['Separable verbs', 'Some verbs split in two: aufstehen → ich stehe um sieben auf. The prefix goes to the end.', 'Ich rufe dich morgen an', 'I will call you tomorrow'],
    ['“Mir geht es …”', 'To say how you are, use mir geht es + a word: mir geht es gut (I’m fine), mir geht es schlecht (I’m not well).', 'Mir geht es gut', 'I am fine'],
  ],
  ko: [
    ['있어요: there is', '있어요 means “there is” or “I have”. 없어요 is the opposite.', '방에 침대가 있어요', 'There is a bed in the room'],
    ['아파요: it hurts', 'Body part + 이/가 + 아파요: 머리가 아파요 (my head hurts), 배가 아파요 (my stomach hurts).', '배가 아파요', 'My stomach hurts'],
    ['시에: at … o’clock', 'Hours use native Korean numbers: 한 시, 두 시, 일곱 시. Add 에 for “at”.', '열 시에 자요', 'I go to bed at ten'],
    ['Feelings are verbs', 'Feeling words work like verbs: 행복해요 (I’m happy), 피곤해요 (I’m tired). Raise your voice at the end to ask.', '피곤해요?', 'Are you tired?'],
  ],
  zh: [
    ['有: there is', '有 (yǒu) means both “there is” and “to have”. 没有 (méiyǒu) is the negative.', '厨房里有一张桌子', 'There is a table in the kitchen'],
    ['疼: it hurts', 'Body part + 疼 (téng): 头疼 (headache), 牙疼 (toothache). No verb for “have” is needed.', '我牙疼', 'I have a toothache'],
    ['Time comes before the verb', 'Chinese puts the time before the action: 我七点起床 is literally “I seven o’clock get up”.', '我十点睡觉', 'I go to bed at ten'],
    ['很 with adjectives', 'Adjectives need no word for “is”, but usually take 很 (hěn): 我很累 (I am tired).', '我很累', 'I am tired'],
  ],
  it: [
    ['“C’è” and “ci sono”', 'C’è is “there is”, ci sono is “there are”: c’è un letto, ci sono due finestre.', 'C’è un tavolo in cucina', 'There is a table in the kitchen'],
    ['“Ho mal di …”', 'Ho mal di + body part says something hurts: ho mal di testa, ho mal di denti (toothache).', 'Ho mal di denti', 'I have a toothache'],
    ['Reflexive verbs', 'Routine verbs take mi, ti, si: alzarsi → mi alzo (I get up), svegliarsi → mi sveglio (I wake up).', 'Mi sveglio alle sei', 'I wake up at six'],
    ['Adjectives match the person', 'Adjectives ending in -o change to -a for a woman: stanco → stanca. Ones ending in -e stay the same: felice.', 'Lei è stanca', 'She is tired'],
  ],
  hi: [
    ['है and हैं', 'Use है for one thing and हैं for several: एक कुर्सी है, दो खिड़कियाँ हैं.', 'रसोई में एक मेज़ है', 'There is a table in the kitchen'],
    ['में दर्द है: it hurts', 'Say मेरे + body part + में दर्द है: मेरे पेट में दर्द है (my stomach hurts).', 'मेरे हाथ में दर्द है', 'My hand hurts'],
    ['Verbs follow the speaker', 'A man says उठता हूँ, a woman says उठती हूँ. The -ता / -ती ending matches the person doing it.', 'वह जल्दी उठती है', 'She gets up early'],
    ['Questions with क्या', 'Put क्या at the start to make a yes/no question: तुम ठीक हो → क्या तुम ठीक हो?', 'क्या तुम थके हुए हो?', 'Are you tired?'],
  ],
  pt: [
    ['“Há”: there is', 'Há works for one thing or many: há uma cama, há duas janelas. In Brazil people usually say “tem”.', 'Há uma mesa na cozinha', 'There is a table in the kitchen'],
    ['“Dói” and “doem”', 'Dói-me + one body part, doem-me + several: dói-me a cabeça, doem-me os pés.', 'Dói-me a mão', 'My hand hurts'],
    ['Reflexive verbs', 'In Portugal the pronoun usually comes after the verb: levanto-me (I get up), deito-me (I go to bed).', 'Deito-me às dez', 'I go to bed at ten'],
    ['“Estar” for feelings', 'Feelings use estar, because they change: está cansado (he is tired), estou triste (I am sad).', 'O meu irmão está cansado', 'My brother is tired'],
  ],
  nl: [
    ['“Er is” and “er zijn”', 'Er is for one thing, er zijn for more: er is een bed, er zijn twee ramen.', 'Er is een tafel in de keuken', 'There is a table in the kitchen'],
    ['Words with -pijn', 'Pijn (pain) joins the body part: hoofdpijn (headache), buikpijn (stomach ache), kiespijn (toothache).', 'Ik heb buikpijn', 'I have a stomach ache'],
    ['Separable verbs', 'Some verbs split in a sentence: opstaan → ik sta om zeven uur op.', 'Ik bel je morgen op', 'I will call you tomorrow'],
    ['“Gaat het?”', 'Gaat het? (literally “does it go?”) asks if someone is okay. Answer: het gaat goed (I’m fine).', 'Het gaat goed', 'I am fine'],
  ],
  ru: [
    ['“Есть”: there is', 'Russian puts the place first: на кухне есть стол (“in the kitchen there is a table”).', 'На кухне есть стол', 'There is a table in the kitchen'],
    ['“У меня болит”', 'У меня болит + body part: у меня болит голова (my head hurts), у меня болит рука.', 'У меня болит зуб', 'I have a toothache'],
    ['Verbs ending in -ся', 'Some routine verbs end in -ся: я просыпаюсь (I wake up), я умываюсь (I wash).', 'Я просыпаюсь рано', 'I wake up early'],
    ['Feelings follow the speaker', 'Some feeling words change for a woman: я рад → я рада (I’m glad), я счастлив → я счастлива.', 'Я рада тебя видеть', 'I am glad to see you (woman speaking)'],
  ],
  ar: [
    ['يوجد: there is', 'يوجد (yuujad) means “there is”: يوجد سرير في الغرفة (there is a bed in the room).', 'يوجد كرسي في المطبخ', 'There is a chair in the kitchen'],
    ['عندي: I have', 'عندي (ʿindii) means “I have”. Use it for pains too: عندي صداع (I have a headache).', 'عندي ألم في يدي', 'I have a pain in my hand'],
    ['Telling the time', 'الساعة (as-saaʿa) + an ordinal number: الساعة السابعة (seven o’clock).', 'الساعة العاشرة', 'Ten o’clock'],
    ['Feelings follow the speaker', 'A man says سعيد (saʿiid), a woman says سعيدة (saʿiida). Most adjectives add ـة for a woman.', 'هي متعبة', 'She is tired'],
  ],
  tr: [
    ['“Var”: there is', 'Var means “there is” and yok means “there isn’t”: mutfakta masa var.', 'Odada bir yatak var', 'There is a bed in the room'],
    ['“My” is an ending', 'Turkish adds “my” to the end of a word: baş → başım (my head), el → elim (my hand).', 'Elim ağrıyor', 'My hand hurts'],
    ['Habits with -ar / -er', 'For things you usually do, Turkish uses -(a)r / -(e)r: kalkarım (I get up), yatarım (I go to bed).', 'Erken kalkarım', 'I get up early'],
    ['“I am” is an ending', 'Add -(y)ım and friends to say “I am”: mutlu → mutluyum, yorgun → yorgunum.', 'Yorgunum', 'I am tired'],
  ],
  id: [
    ['“Ada”: there is', 'Ada means “there is” or “there are”. Tidak ada is the negative.', 'Ada meja di dapur', 'There is a table in the kitchen'],
    ['“Sakit”', 'Sakit means sick or sore. Put it after the body part: kepala saya sakit, perut saya sakit.', 'Perut saya sakit', 'My stomach hurts'],
    ['Telling the time with “jam”', 'Jam + number gives the time: jam tujuh (seven o’clock).', 'Saya tidur jam sepuluh', 'I go to bed at ten'],
    ['No “am” or “is”', 'Indonesian needs no verb before an adjective: saya senang (I am happy), dia lelah (she is tired).', 'Dia lelah', 'She is tired'],
  ],
  sv: [
    ['“Det finns”: there is', 'Det finns works for one thing or many: det finns en säng, det finns två fönster.', 'Det finns ett bord i köket', 'There is a table in the kitchen'],
    ['Words with -värk', 'Värk (ache) joins the body part: huvudvärk (headache), magvärk (stomach ache), tandvärk (toothache).', 'Jag har tandvärk', 'I have a toothache'],
    ['The verb comes second', 'The verb is always the second part of a sentence: Klockan sju går jag upp (At seven I get up).', 'På morgonen dricker jag kaffe', 'In the morning I drink coffee'],
    ['Adjective endings', 'Adjectives add -t with ett-words and -a in the plural: glad, glatt, glada.', 'Vi är glada', 'We are happy'],
  ],
  pl: [
    ['“Jest” and “są”', 'Jest is “there is”, są is “there are”: w kuchni jest stół, są dwa okna.', 'W kuchni jest stół', 'There is a table in the kitchen'],
    ['“Boli mnie”', 'Boli mnie + body part: boli mnie głowa (my head hurts). For several: bolą mnie nogi.', 'Boli mnie ząb', 'I have a toothache'],
    ['Verbs with “się”', 'Many routine verbs take się: budzić się (to wake up) → budzę się o szóstej.', 'Budzę się o szóstej', 'I wake up at six'],
    ['Adjectives follow the speaker', 'A man says jestem zmęczony, a woman says jestem zmęczona.', 'Ona jest zmęczona', 'She is tired'],
  ],
};
for (const [id, tips] of Object.entries(MORE_TIPS)) TIPS[id].push(...tips);

Object.assign(ROMAN.zh, {
  '我的家很大': 'wǒ de jiā hěn dà', '厨房': 'chúfáng', '请进': 'qǐng jìn', '钥匙在桌子上': 'yàoshi zài zhuōzi shang', '床': 'chuáng',
  '门': 'mén', '窗户': 'chuānghu', '椅子': 'yǐzi', '家': 'jiā', '桌子': 'zhuōzi',
  '我头疼': 'wǒ tóu téng', '医生': 'yīshēng', '我不舒服': 'wǒ bù shūfu', '药店在哪里？': 'yàodiàn zài nǎlǐ?', '药': 'yào',
  '医院': 'yīyuàn', '头': 'tóu', '手': 'shǒu', '药店': 'yàodiàn',
  '我七点起床': 'wǒ qī diǎn qǐchuáng', '早饭': 'zǎofàn', '晚安': "wǎn'ān", '我睡得很晚': 'wǒ shuì de hěn wǎn', '早上': 'zǎoshang',
  '晚上': 'wǎnshang', '夜里': 'yèli', '早': 'zǎo', '晚': 'wǎn',
  '我非常开心': 'wǒ fēicháng kāixīn', '累': 'lèi', '别担心': 'bié dānxīn', '你还好吗？': 'nǐ hái hǎo ma?', '难过': 'nánguò',
  '开心': 'kāixīn', '生气': 'shēngqì', '平静': 'píngjìng', '无聊': 'wúliáo',
  '厨房里有一张桌子': 'chúfáng lǐ yǒu yì zhāng zhuōzi', '我牙疼': 'wǒ yá téng', '我十点睡觉': 'wǒ shí diǎn shuìjiào', '我很累': 'wǒ hěn lèi',
});

Object.assign(ROMAN.ko, {
  '제 집은 커요': 'je jibeun keoyo', '부엌': 'bueok', '어서 들어오세요': 'eoseo deureooseyo', '열쇠는 테이블 위에 있어요': 'yeolsoeneun teibeul wie isseoyo',
  '침대': 'chimdae', '문': 'mun', '창문': 'changmun', '의자': 'uija', '집': 'jip', '테이블': 'teibeul',
  '머리가 아파요': 'meoriga apayo', '의사': 'uisa', '몸이 안 좋아요': 'momi an joayo', '약국이 어디예요?': 'yakgugi eodiyeyo?', '약': 'yak',
  '병원': 'byeongwon', '머리': 'meori', '손': 'son', '약국': 'yakguk',
  '저는 일곱 시에 일어나요': 'jeoneun ilgop sie ireonayo', '아침 식사': 'achim siksa', '안녕히 주무세요': 'annyeonghi jumuseyo',
  '저는 늦게 자요': 'jeoneun neutge jayo', '아침': 'achim', '저녁': 'jeonyeok', '밤': 'bam', '일찍': 'iljjik', '늦게': 'neutge',
  '저는 정말 행복해요': 'jeoneun jeongmal haengbokaeyo', '피곤해요': 'pigonhaeyo', '걱정하지 마세요': 'geokjeonghaji maseyo', '괜찮아요?': 'gwaenchanayo?',
  '슬퍼요': 'seulpeoyo', '행복해요': 'haengbokaeyo', '화나요': 'hwanayo', '차분해요': 'chabunhaeyo', '심심해요': 'simsimhaeyo',
  '방에 침대가 있어요': 'bange chimdaega isseoyo', '배가 아파요': 'baega apayo', '열 시에 자요': 'yeol sie jayo', '피곤해요?': 'pigonhaeyo?',
});

Object.assign(ROMAN.hi, {
  'मेरा घर बड़ा है': 'mera ghar bada hai', 'रसोई': 'rasoi', 'अंदर आइए': 'andar aaiye', 'चाबी मेज़ पर है': 'chaabi mez par hai', 'बिस्तर': 'bistar',
  'दरवाज़ा': 'darvaaza', 'खिड़की': 'khidki', 'कुर्सी': 'kursi', 'घर': 'ghar', 'मेज़': 'mez',
  'मेरे सिर में दर्द है': 'mere sir mein dard hai', 'डॉक्टर': 'doktar', 'मेरी तबीयत ठीक नहीं है': 'meri tabiyat theek nahin hai',
  'दवा की दुकान कहाँ है?': 'dava ki dukaan kahaan hai?', 'दवा': 'dava', 'अस्पताल': 'aspataal', 'सिर': 'sir', 'हाथ': 'haath', 'दवा की दुकान': 'dava ki dukaan',
  'मैं सात बजे उठता हूँ': 'main saat baje uthta hoon', 'मैं सात बजे उठती हूँ': 'main saat baje uthti hoon', 'नाश्ता': 'naashta', 'शुभ रात्रि': 'shubh raatri',
  'मैं देर से सोता हूँ': 'main der se sota hoon', 'मैं देर से सोती हूँ': 'main der se soti hoon', 'सुबह': 'subah', 'शाम': 'shaam', 'रात': 'raat',
  'जल्दी': 'jaldi', 'देर से': 'der se',
  'मैं बहुत ख़ुश हूँ': 'main bahut khush hoon', 'थका हुआ': 'thaka hua', 'चिंता मत करो': 'chinta mat karo', 'क्या तुम ठीक हो?': 'kya tum theek ho?',
  'उदास': 'udaas', 'ख़ुश': 'khush', 'ग़ुस्सा': 'ghussa', 'शांत': 'shaant', 'ऊबा हुआ': 'ooba hua',
  'रसोई में एक मेज़ है': 'rasoi mein ek mez hai', 'मेरे हाथ में दर्द है': 'mere haath mein dard hai', 'वह जल्दी उठती है': 'vah jaldi uthti hai',
  'क्या तुम थके हुए हो?': 'kya tum thake hue ho?',
});

Object.assign(ROMAN.ar, {
  'بيتي كبير': 'bayti kabiir', 'مطبخ': 'matbakh', 'تفضل بالدخول': 'tafaddal bid-dukhuul', 'المفتاح على الطاولة': "al-miftaah 'alaa at-taawila",
  'سرير': 'sariir', 'باب': 'baab', 'نافذة': 'naafidha', 'كرسي': 'kursii', 'بيت': 'bayt', 'طاولة': 'taawila',
  'عندي صداع': "'indii sudaa'", 'طبيب': 'tabiib', 'أشعر بتوعك': "ash'ur bi-tawa''uk", 'أين الصيدلية؟': 'ayna as-saydaliyya?', 'دواء': "dawaa'",
  'مستشفى': 'mustashfaa', 'رأس': "ra's", 'يد': 'yad', 'صيدلية': 'saydaliyya',
  'أستيقظ في الساعة السابعة': "astayqiz fii as-saa'a as-saabi'a", 'فطور': 'futuur', 'تصبح على خير': "tusbih 'alaa khayr", 'أنام متأخرا': "anaam muta'akhkhiran",
  'صباح': 'sabaah', 'مساء': "masaa'", 'ليل': 'layl', 'مبكرا': 'mubakkiran', 'متأخرا': "muta'akhkhiran",
  'أنا سعيد جدا': "ana sa'iid jiddan", 'أنا سعيدة جدا': "ana sa'iida jiddan", 'متعب': "mut'ab", 'لا تقلق': 'laa taqlaq', 'هل أنت بخير؟': 'hal anta bikhayr?',
  'حزين': 'haziin', 'سعيد': "sa'iid", 'غاضب': 'ghaadib', 'هادئ': "haadi'", 'ضجر': 'dajir',
  'يوجد كرسي في المطبخ': 'yuujad kursii fii al-matbakh', 'عندي ألم في يدي': "'indii alam fii yadii", 'الساعة العاشرة': "as-saa'a al-'aashira", 'هي متعبة': "hiya mut'aba",
});
