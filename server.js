const express = require('express');
const app = express();
const PORT = 3002;
app.set('view engine', 'ejs');
app.use(express.static('public'));
const categoryNames = {
  business: 'Бизнес',
  economics: 'Экономика',
  economic: 'Экономика',
  finance: 'Финансы',
  finances: 'Финансы',
  politics: 'Политика',
  auto: 'Авто',
  technology: 'Технологии',
  realty: 'Недвижимость',
  management: 'Менеджмент',
  opinion: 'Мнения',
  lifestyle: 'Стиль жизни',
  sport: 'Спорт',
  industry: 'Промышленность',
};
app.get('/:count/news/for/:category', async (req, res) => {
  const count = Number(req.params.count);  
  const category = req.params.category;    

  if (!Number.isInteger(count) || count <= 0) {
    return res.status(400).send('Ошибка: число новостей должно быть целым положительным числом');
  }


  if (!/^[a-z_]+$/.test(category)) {
    return res.status(400).send('Ошибка: неправильное название категории');
  }

  try {
    const rssUrl = 'https://www.vedomosti.ru/rss/rubric/' + category;
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);

    const response = await fetch(apiUrl);

    const data = await response.json();

    if (data.status !== 'ok') {
      return res.status(502).send('Ошибка от rss2json: ' + (data.message || 'неизвестная ошибка'));
    }

    const news = data.items.slice(0, count);

    res.render('news', {
      count: news.length,
      categoryName: categoryNames[category] || category,
      news: news,
    });
  } catch (err) {

    console.log(err);
    res.status(500).send('Ошибка сервера, попробуйте позже');
  }
});

app.get('/categories', async (req, res) => {
  try {
    const response = await fetch('https://www.vedomosti.ru/info/rss');
    const html = await response.text(); 

    const regexp = /\/rss\/rubric\/([a-z_]+)/g;
    const found = [];
    let match;
    while ((match = regexp.exec(html)) !== null) {
      const slug = match[1];            
      if (!found.includes(slug)) {      
        found.push(slug);
      }
    }

    const categories = found.map((slug) => {
      return { id: slug, name: categoryNames[slug] || slug };
    });

    if (categories.length === 0) {
      return res.json(getDefaultCategories());
    }

    res.json(categories); 
  } catch (err) {
    console.log(err);
    res.json(getDefaultCategories());
  }
});

function getDefaultCategories() {
  return ['business', 'economic', 'finances', 'politics'].map((slug) => {
    return { id: slug, name: categoryNames[slug] };
  });
}


app.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
});
