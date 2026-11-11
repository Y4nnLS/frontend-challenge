export default {
  extends: 'lighthouse:desktop',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    output: ['html', 'json'],
    chromeFlags: '--headless=new',
  },
}
