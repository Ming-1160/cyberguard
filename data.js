/* ==========================================================================
   CyberGuard — content bank
   Every user-facing string is a pair: [ English, 繁體中文 ].
   Nothing here is real: all artefacts are drawings and all cases are fictional.
   Terms follow the textbook (Compulsory C2, Section 5.1, pp. 58–67);
   Chinese terms follow the Chinese edition of the same textbook.
   ========================================================================== */
window.DATA = {

/* ---------------------------------------------------------------- types
   colour + icon for each type live in app.js (TYPE_COLOR, ICON)          */
types: [
  { id:'ransomware', n:1, name:['Ransomware','勒索軟件'],
    def:['Locks your files with encryption and demands a ransom to unlock them.',
         '用加密方式鎖住你的檔案，並索取贖金才解鎖。'],
    clue:['I lock files using encryption. A ransom must be paid to unlock them.',
          '我用加密鎖住檔案，必須支付贖金才能解鎖。'],
    tell:['Files are encrypted and a ransom is demanded.',
          '檔案被加密，並被索取贖金。'] },

  { id:'spyware', n:2, name:['Spyware','間諜軟件'],
    def:['Secretly records what you type, such as passwords and keystrokes.',
         '暗中記錄你輸入的內容，例如密碼和鍵盤敲擊。'],
    clue:['I secretly record information such as passwords or keystrokes.',
          '我暗中記錄密碼或鍵盤輸入等資料。'],
    tell:['Secretly records what you type — passwords, keystrokes.',
          '暗中記錄你輸入的內容 —— 密碼、鍵盤敲擊。'] },

  { id:'virus', n:3, name:['Virus','電腦病毒'],
    def:['Attaches itself to other programs or files, copies itself and damages other files.',
         '依附於其他程式或檔案，自我複製並破壞其他檔案。'],
    clue:['I attach to a file. I copy myself and cause damage to other files.',
          '我依附在檔案上，自我複製並破壞其他檔案。'],
    tell:['Attached to other programs; copies itself and damages other files.',
          '依附於其他程式；自我複製並破壞其他檔案。'] },

  { id:'adware', n:4, name:['Adware','廣告軟件'],
    def:['Displays unwanted advertisements, often bundled with free software.',
         '顯示不受歡迎的廣告，常隨免費軟件附帶。'],
    clue:['I display annoying advertisements. I can be included with free software.',
          '我顯示令人煩厭的廣告，可以隨免費軟件附帶。'],
    tell:['Shows unwanted adverts; often bundled with free software.',
          '顯示不受歡迎的廣告；常隨免費軟件附帶。'] },

  { id:'trojan', n:5, name:['Trojan program','木馬程式'],
    def:['Pretends to be a useful application but opens a gateway for intruders. It does not copy itself.',
         '偽裝成有用的應用程式，卻為入侵者打開通道。它不會自我複製。'],
    clue:["I pretend to be a useful application but can be a gateway for intruders. I don't replicate.",
          '我偽裝成有用的應用程式，卻可能成為入侵者的通道。我不會自我複製。'],
    tell:['Pretends to be useful but opens a gateway for intruders; does not replicate.',
          '偽裝成有用的程式，卻為入侵者打開通道；不會自我複製。'] },

  { id:'worm', n:6, name:['Worm','蠕蟲'],
    def:['Needs no host file. Copies itself and spreads by itself across networks.',
         '不需要宿主檔案，會自我複製並自行在網絡上傳播。'],
    clue:["I don't need a host file. I can spread by myself across networks.",
          '我不需要宿主檔案，可以自行在網絡上傳播。'],
    tell:['No host file needed; copies itself and spreads by itself across networks.',
          '不需宿主檔案；自我複製並自行在網絡上傳播。'] }
],

/* comparison table: virus / worm / Trojan program  (Table 5.1, textbook p. 62) */
compare: {
  cols: [['Virus','電腦病毒'], ['Worm','蠕蟲'], ['Trojan program','木馬程式']],
  ids:  ['virus', 'worm', 'trojan'],
  rows: [
    [['Attached to other programs','依附於其他程式'],                   [true,  false, true ]],
    [['Self-replication','自我複製'],                                   [true,  true,  false]],
    [['Automatically spreads on computer networks','在電腦網絡上自動傳播'], [false, true,  false]]
  ]
},

/* ---------------------------------------------------------------- clue chips */
chips: [
  { id:'locks',   t:['It locks my files and asks for money','它鎖住我的檔案並要求付款'] },
  { id:'records', t:['It records what I type','它記錄我輸入的內容'] },
  { id:'host',    t:['It is attached to other programs','它依附於其他程式'] },
  { id:'ads',     t:['It shows adverts','它顯示廣告'] },
  { id:'useful',  t:['It pretends to be useful','它偽裝成有用的程式'] },
  { id:'network', t:['It spreads across the network by itself','它自行在網絡上傳播'] },
  { id:'copies',  t:['It copies itself into other files','它複製到其他檔案'] }
],

/* ---------------------------------------------------------------- round A: 6 picture items
   chip: the main clue. A list means more than one clue is accepted —
   Table 5.1 marks both viruses and Trojan programs as "attached to other programs". */
items: [
  { id:'A1', art:'a1', answer:'ransomware', chip:'locks',
    alt:['A laptop showing a padlock screen, a countdown and a payment demand',
         '筆記型電腦顯示鎖頭畫面、倒數和付款要求'],
    sit:['All my photos are locked. A message says I must pay within 48 hours.',
         '我的相片全部被鎖住，訊息說我必須在 48 小時內付款。'],
    why:['Files are encrypted and a ransom is demanded — that is ransomware.',
         '檔案被加密並被索取贖金 —— 這是勒索軟件。'] },

  { id:'A2', art:'a2', answer:'spyware', chip:'records',
    alt:['A keyboard with faint lines running to a hooded figure off-screen',
         '鍵盤上有淡淡的線連到畫面外一個戴帽的人影'],
    sit:['Nothing looks different, but my passwords were used somewhere else.',
         '表面沒有異樣，但我的密碼在別處被人使用了。'],
    why:['Secretly recording what you type is spyware.',
         '暗中記錄你輸入的內容，就是間諜軟件。'] },

  { id:'A3', art:'a3', answer:'virus', chip:['copies', 'host'],
    alt:['A document with smaller copies of itself spreading across a folder',
         '一份文件，以及散落在資料夾中的多個副本'],
    sit:['I opened my own report and now three other files will not open.',
         '我打開自己的報告後，另外三個檔案就打不開了。'],
    why:['It attached to a file, copied itself and damaged other files — a virus.',
         '它依附檔案、自我複製並破壞其他檔案 —— 這是電腦病毒。'] },

  { id:'A4', art:'a4', answer:'adware', chip:'ads',
    alt:['A free game window crowded with advertisement panels',
         '免費遊戲視窗被多個廣告面板擠滿'],
    sit:['I installed a free game and now adverts open by themselves.',
         '我安裝了一個免費遊戲，現在廣告會自己彈出來。'],
    why:['Unwanted adverts, bundled with free software — adware.',
         '不受歡迎的廣告隨免費軟件附帶 —— 這是廣告軟件。'] },

  { id:'A5', art:'a5', answer:'trojan', chip:['useful', 'host'],
    alt:['A free video player with a door opening behind it',
         '一個免費播放器，背後有一道門正在打開'],
    sit:['It works fine, but someone else seems to have access to my computer.',
         '它運作正常，但似乎有人可以進入我的電腦。'],
    why:['It pretended to be useful and opened a gateway, without copying itself — a Trojan program.',
         '它偽裝成有用的程式，卻打開了通道，而且沒有自我複製 —— 這是木馬程式。'] },

  { id:'A6', art:'a6', answer:'worm', chip:'network',
    alt:['Several computers in a row, with infection travelling along the cables between them',
         '一排電腦，感染沿著連接的線纜逐部擴散'],
    sit:['No one opened anything, but the whole lab slowed down one by one.',
         '沒有人打開任何東西，但整間實驗室的電腦一部接一部變慢。'],
    why:['It moved across the network on its own, needing no host file — a worm.',
         '它自行經網絡移動，不需要宿主檔案 —— 這是蠕蟲。'] }
],

/* ---------------------------------------------------------------- round B: Checkpoint MCQs
   The questions follow Checkpoint 5.1 (p. 63) and 5.2 (p. 66) with the same keys.
   The option wording is paraphrased on purpose, so the textbook text is not copied
   onto a public website. Students check the original wording in their own book. */
checkpoint: [
  { id:'B1', key:'A',
    q:['Which feature is NOT shared by worms?','以下哪一項不是蠕蟲的特徵？'],
    opts:[['A','Disguised as a useful application','偽裝成有用的應用程式'],
          ['B','Copies itself','自我複製'],
          ['C','Spreads across a network','經網絡傳播'],
          ['D','Does not need a host file','不需要宿主檔案']],
    why:['Disguising itself as a useful app is what a Trojan program does. Worms do copy themselves and spread without a host, so B, C and D all describe worms.',
         '偽裝成有用的應用程式是木馬程式的特徵。蠕蟲確實會自我複製，並在沒有宿主的情況下傳播，所以 B、C、D 都是在描述蠕蟲。'] },

  { id:'B2', key:'C',
    q:['Which malware is attached to other programs?','哪一種惡意軟件依附於其他程式？'],
    opts:[['A','Worms','蠕蟲'],
          ['B','Adware','廣告軟件'],
          ['C','Viruses and Trojan programs','電腦病毒與木馬程式'],
          ['D','Spyware only','只有間諜軟件']],
    why:['Table 5.1 (p. 62): viruses and Trojan programs are attached to other programs; worms are not.',
         '表 5.1（第 62 頁）：電腦病毒和木馬程式都依附於其他程式；蠕蟲則不會。'] },

  { id:'B3', key:'D',
    q:['Which of these is a Trojan-related threat?','以下哪一項是木馬程式相關的威脅？'],
    opts:[['A','Locked files and a ransom demand','檔案被鎖並被索取贖金'],
          ['B','Pop-up advertisements','彈出式廣告'],
          ['C','Slow network traffic','網絡流量變慢'],
          ['D','Recorded activity, stolen credentials and camera spying','活動被記錄、登入資料被竊、鏡頭被窺看']],
    why:['The Trojan program opens a backdoor; what the intruder then does — recording, stealing log-ins, using the camera — is the harm. A belongs to ransomware.',
         '木馬程式開了一道後門；入侵者之後所做的 —— 記錄、竊取登入資料、使用鏡頭 —— 就是損害。A 屬於勒索軟件。'] },

  { id:'B4', key:'C',
    q:['What should you do if ransomware demands payment?','如果勒索軟件要求付款，你應該怎樣做？'],
    opts:[['A','Pay quickly to get the files back','盡快付款以取回檔案'],
          ['B','Delete the message and continue','刪除訊息並繼續使用'],
          ['C','Report it quickly to the police','盡快報警'],
          ['D','Restart the computer repeatedly','不斷重新啟動電腦']],
    why:['Reporting preserves evidence and is the response the textbook gives. Paying funds the attackers and does not guarantee the files return.',
         '報警可保存證據，也是教科書給出的回應。付款等同資助攻擊者，而且不保證能取回檔案。'] }
],

/* ---------------------------------------------------------------- infection routes
   t = the textbook heading (pp. 66–67); d = what it looks like in real life */
routes: [
  { id:'script', t:['Dynamic web page and client-side script','動態網頁及客戶端手稿程式'],
    d:['A malicious script on a web page runs while you browse it.','你瀏覽網頁時，網頁上的惡意手稿程式便會執行。'],
    note:['Not every script is dangerous — the risk is the source, not the technology.',
          '並非所有手稿程式都危險 —— 風險在於來源，而非技術本身。'] },
  { id:'email',  t:['Communication software and email','通訊軟件及電子郵件'],
    d:['An attachment or link in an email or instant message.','電子郵件或即時通訊訊息中的附件或超連結。'], note:null },
  { id:'free',   t:['Freeware and shareware','免費軟件及共享軟件'],
    d:['Software from a suspicious website, with malware attached.','從可疑網站下載的軟件，內附惡意軟件。'], note:null },
  { id:'media',  t:['Various storage devices','各種儲存設備'],
    d:['An infected CD, memory card or USB flash memory.','受感染的光碟、記憶卡或 USB 快閃記憶體。'], note:null }
],

evidence: [
  { id:'popup', art:'popup', t:['A pop-up warning appears while you watch a film online','網上看電影時彈出一個警告視窗'],
    route:'script',
    why:['The infection came through the page you were viewing — a script on that page.',
         '感染來自你正在瀏覽的網頁 —— 該網頁上的手稿程式。'] },
  { id:'mail', art:'mail', t:['An unexpected email arrives with an attachment (like ILOVEYOU)','一封意料之外、附有附件的電子郵件（例如 ILOVEYOU）'],
    route:'email',
    why:['The harmful code travelled in the attachment of the message.',
         '有害程式碼藏在訊息的附件中傳播。'] },
  { id:'app', art:'app', t:['A free filter app from an unknown publisher','來自不明發行者的免費濾鏡應用程式'],
    route:'free',
    why:['It came from untrusted freeware.',
         '它來自不可信的免費軟件。'] },
  { id:'usb', art:'usb', t:['A USB flash drive found in the corridor','在走廊拾獲的 USB 快閃記憶體'],
    route:'media',
    why:['The infection travelled on a storage device.',
         '感染經儲存設備傳播。'] }
],

/* threats of malware infection (textbook p. 67) */
consequences: [
  ['Someone gets into the system or data without permission','他人未經授權進入系統或存取資料'],
  ['Data is stolen','資料被竊取'],
  ['Data is locked, changed or destroyed','資料被上鎖、修改或銷毀'],
  ['A ransom is demanded to get the data back','被索取贖金以解密或取回資料'],
  ['Computer and network resources are used up; the system is paralysed','電腦和網絡資源被耗盡，令系統癱瘓'],
  ['The device is controlled remotely by someone else','裝置被他人遠程控制']
],

/* ---------------------------------------------------------------- the four case files */
cases: [
  { id:1, who:'Leo',
    text:['Leo clicked a link to stream films for free. A malicious script downloaded from that page. His files were encrypted and he was asked to pay a ransom.',
          'Leo 點擊了一個免費看電影的連結，一個惡意手稿程式從該網頁下載到他的電腦。他的檔案被加密，並被要求支付贖金。'],
    key:{ type:'ransomware', route:'script',
          harms:[['Files locked and extorted','檔案被鎖並被勒索'],
                 ['Loss of school work','學校功課損失']] },
    evidence:[['Clicked a link to stream films for free','點擊免費看電影的連結',false],
              ['A malicious script downloaded from that page','惡意手稿程式從該網頁下載',false],
              ['His files were encrypted','他的檔案被加密',true],
              ['He was asked to pay a ransom','他被要求支付贖金',true]],
    clues:[['Something was taken away and something was demanded back.','有些東西被拿走，有些東西被要求交還。'],
           ['Nothing copied itself into other files.','沒有任何東西複製到其他檔案。'],
           ['The files still exist but cannot be opened without a key.','檔案仍然存在，但沒有鑰匙就打不開。']] },

  { id:2, who:'Mary',
    text:['Mary opened an attachment in an unexpected email. The program copied itself and emailed all of her contacts.',
          'Mary 打開了一封意料之外的電子郵件中的附件。程式自我複製，並把電郵發給她的所有聯絡人。'],
    key:{ type:'worm', route:'email',
          harms:[['Network resources used up — the network slows down or is paralysed','網絡資源被耗盡，網絡變慢甚至癱瘓'],
                 ['Her contacts were infected too','她的聯絡人亦被感染']] },
    evidence:[['An unexpected email','一封意料之外的電子郵件',false],
              ['Opened an attachment','打開了附件',false],
              ['The program copied itself','程式自我複製',true],
              ['Emailed all of her contacts','電郵發給所有聯絡人',true]],
    clues:[['Nothing attached itself to a document on Mary’s computer.','沒有任何東西依附在 Mary 電腦上的文件。'],
           ['Nobody ever asked for money.','從來沒有人要求付款。'],
           ['It moved from machine to machine on its own.','它自行由一部電腦去到另一部。']] },

  { id:3, who:'Ken',
    text:['Ken downloaded a free photo filter from an unknown source. It gave an outside party remote access. His payment details were later used without his permission.',
          'Ken 從不明來源下載了一個免費濾鏡。它讓外人可以遠程存取他的電腦，他的付款資料後來被人未經許可使用。'],
    key:{ type:'trojan', route:'free',
          harms:[['Unauthorised access and theft of financial information','未經授權進入系統及財務資料被竊'],
                 ['Identity and payment fraud','身份及付款欺詐']] },
    evidence:[['Downloaded from an unknown source','從不明來源下載',false],
              ['A free photo filter','免費濾鏡',false],
              ['It gave an outside party remote access','讓外人可以遠程存取',true],
              ['Payment details used without permission','付款資料被未經許可使用',true]],
    clues:[['The program did exactly what it promised.','程式做到了它承諾的事。'],
           ['It never copied itself.','它從未自我複製。'],
           ['The harm came from the door it left open.','損害來自它留下的那道門。']] },

  { id:4, who:'Mr Lee',
    text:['Mr Lee opened an infected executable file from an unknown USB flash drive. The code copied itself into other files and deleted some documents.',
          'Mr Lee 打開了來自不明 USB 快閃記憶體的一個受感染執行檔。程式碼複製到其他檔案，並刪除了部分文件。'],
    key:{ type:'virus', route:'media',
          harms:[['Data lost and systems malfunctioning','資料損失及系統失靈'],
                 ['Other files corrupted','其他檔案損毀']] },
    evidence:[['An infected executable file','一個受感染的執行檔',false],
              ['An unknown USB flash drive','不明的 USB 快閃記憶體',false],
              ['The code copied itself into other files','程式碼複製到其他檔案',true],
              ['Deleted some documents','刪除了部分文件',true]],
    clues:[['The first infected file was not downloaded.','第一個受感染的檔案並非下載得來。'],
           ['It did not spread over the network by itself.','它沒有自行經網絡擴散。'],
           ['It needed a host file to travel in.','它需要一個宿主檔案才能傳播。']] }
],

/* group -> case  (groups 1&5 share case 1, and so on) */
groupCase: {1:1, 2:2, 3:3, 4:4, 5:1, 6:2, 7:3, 8:4},

/* ---------------------------------------------------------------- support layer
   shown in both languages at once (the lesson plan gives keywords in English and Chinese) */
wordbank: [
  ['ransomware','勒索軟件'],['spyware','間諜軟件'],['virus','電腦病毒'],
  ['adware','廣告軟件'],['Trojan program','木馬程式'],['worm','蠕蟲'],
  ['encrypted','被加密'],['copied itself','自我複製'],['remote access','遠程存取'],
  ['attachment','附件'],['freeware','免費軟件'],['USB flash memory','USB 快閃記憶體']
],

starters: [
  ['This is … because …','這是……因為……'],
  ['The evidence is … because the text says …','證據是……因為文中說……'],
  ['It probably spread through … because …','它大概是經……傳播，因為……']
],

/* ---------------------------------------------------------------- teacher */
crossref: [
  ['0–5','Hook / 引入','#/hook','Slide 1'],
  ['5–19','Six types / 六種類型','#/learn','Slides 2–3'],
  ['19–31','Quiz / 測驗','#/quiz','Slide 4'],
  ['31–41','Routes / 途徑','#/routes','Slides 5–6'],
  ['41–63','Cases / 個案','#/cases','—'],
  ['63–70','Exit slip / 離堂小測','#/exit','Slide 7']
],

/* ---------------------------------------------------------------- v4: Part 3, the exit question
   The case is E2 on the class worksheet. Two types fit, so both are accepted. */
exit: {
  text: ['Tina downloads a free homework-helper browser add-on from an unfamiliar website. It works as normal, but it secretly collects what she types. A week later, someone logs in to her school email with her password.',
         'Tina 從一個不熟悉的網站下載了一個免費的「功課助手」瀏覽器附加元件。它運作正常，但暗中收集她輸入的內容。一星期後，有人用她的密碼登入了她的學校電郵。'],
  q1: ['What type of malware could this be? Choose <b>all</b> the possible answers.', '這可能是哪一種惡意軟件？選出<b>所有</b>可能的答案。'],
  types: ['spyware', 'trojan'],
  why1: ['Two answers fit. Spyware: it secretly collects what she types. Trojan program: it looks like a useful add-on and works as normal, but it lets someone else get her data.',
         '有兩個答案合理。間諜軟件：它暗中收集她輸入的內容。木馬程式：它看似有用而且運作正常，卻讓其他人取得她的資料。'],
  q2: ['How did it get into her computer?', '它是經哪個途徑進入她的電腦？'],
  route: 'free',
  why2: ['Freeware and shareware: she downloaded a free add-on from an unfamiliar website.', '免費軟件及共享軟件：她從不熟悉的網站下載了免費的附加元件。'],
  q3: ['Write <b>two</b> different problems this could cause for Tina. Use the word “because”.', '寫出這件事可能為 Tina 帶來的<b>兩個</b>不同問題，並用「因為」。'],
  model: ['Someone can read or send her emails without permission, because they have her password. Her other accounts could be stolen too, because the add-on records everything she types.',
          '其他人可以未經許可閱讀或發送她的電郵，因為他們有她的密碼。她的其他帳戶也可能被盜，因為附加元件會記錄她輸入的所有內容。']
},

/* v4: the homework is the group's own sheet, handed out on paper (18 marks) */
homework2: {
  text: ['Finish the homework sheet your teacher gives you (18 marks). Hand it in on paper.', '完成老師派發的家課工作紙（共 18 分），以紙本提交。'],
  parts: [['Part A: match the six types of malware (6 marks)', '甲部：配對六種惡意軟件（6 分）'],
          ['Part B: three multiple-choice questions (3 marks)', '乙部：三條選擇題（3 分）'],
          ['Part C: two cases, Peter and Tom (9 marks)', '丙部：兩個個案，Peter 和 Tom（9 分）']]
},

homework: [
  { ref:['Chapter Exercise Q3 (p. 118)','課本練習第 3 題（第 118 頁）'],
    ask:['Copy the exact question wording from the textbook, then use this structure.',
         '請照抄課本的題目原文，然後使用以下結構。'],
    steps:[['Name the type and give one feature that proves it.','說出類型，並提出一項能證明它的特徵。'],
           ['State how it spreads, using the word “because”.','說明它如何傳播，並用「因為」。'],
           ['State one consequence for the user.','說明對使用者的一項後果。']] },
  { ref:['Chapter Exercise Q9(a) (p. 119)','課本練習第 9(a) 題（第 119 頁）'],
    ask:['Copy the exact question wording from the textbook, then use this structure.',
         '請照抄課本的題目原文，然後使用以下結構。'],
    steps:[['Say what the evidence shows, not what you assume.','說出證據顯示甚麼，而不是你假設甚麼。'],
           ['Link the evidence to one named type.','把證據連到一個指明的類型。'],
           ['Add the safest action the user should take.','加上使用者應採取的最安全行動。']] }
]
};
