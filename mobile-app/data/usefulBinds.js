export const USEFUL_BINDS = [
  {
    group: 'Аудио',
    items: [
      { cmd: 'audio.game 0.22', desc: 'Тише игровые звуки' },
      { cmd: 'audio.master 1.5', desc: 'Громче общая громкость' },
      { cmd: 'audio.music 0', desc: 'Убрать фоновую музыку' },
      { cmd: 'audio.ambient 0', desc: 'Отключить фоновые звуки окружения' },
      { cmd: 'audio.footsteps.volume 3', desc: 'Усилить звук шагов противников' },
    ],
  },
  {
    group: 'Зум и прицеливание',
    items: [
      { cmd: '+fov', desc: 'Удержание для приближения (аналог зума)' },
      { cmd: 'bind mouse3 +zoom.in', desc: 'Быстрое приближение экрана на среднюю кнопку мыши' },
      { cmd: 'graphics.hud_reticle_scale 0.8', desc: 'Уменьшить размер прицела' },
      { cmd: 'graphics.hats false', desc: 'Скрыть шляпу/головной убор в прицеле' },
      { cmd: 'graphics.hud false', desc: 'Спрятать весь интерфейс (вернуть: graphics.hud true)' },
    ],
  },
  {
    group: 'FPS и память',
    items: [
      { cmd: 'graphics.drawdistance 3000', desc: 'Дальность прорисовки' },
      { cmd: 'effects.maxgibs -1', desc: 'Отключить обломки/дебрис от разрушений' },
      { cmd: 'grass.displacement false', desc: 'Отключить смещение травы' },
      { cmd: 'grass.on false', desc: 'Временно отключить траву целиком' },
      { cmd: 'gc.collect', desc: 'Принудительная очистка мусора (сборка GC)' },
    ],
  },
  {
    group: 'Обзор и управление',
    items: [
      { cmd: 'input.sensitivity 0.8', desc: 'Общая чувствительность мыши (подкрути под себя)' },
      { cmd: 'client.lookatradius 0.2', desc: 'Радиус взаимодействия/подбора предметов' },
      { cmd: 'bind f1 consoletoggle', desc: 'Консоль и комбатлог одной клавишей' },
    ],
  },
  {
    group: 'Геймплей',
    items: [
      {
        cmd: 'bind k "kill;respawn_sleepingbag"',
        desc: 'Мгновенный киллсебя + респавн на спалке',
      },
      {
        cmd: 'forward;sprint',
        desc: 'Авто-бег — повесь на клавишу: bind КЛАВИШАНА forward;sprint',
      },
    ],
  },
  {
    group: 'Новые бинды (ТЗ 2.4)',
    items: [
      { cmd: 'bind p chat.open team', desc: 'Открыть тим-чат одной клавишей' },
      { cmd: 'bind o craft.cancel', desc: 'Мгновенная отмена текущего крафта' },
      { cmd: 'bind m audio.game 0', desc: 'Быстрый мьют игры (повторный ввод вернёт громкость)' },
      { cmd: 'bind [ "attack;+attack2"', desc: 'Комбо-удар: удар + блок на одну кнопку' },
      { cmd: 'bind ] +lighttoggle', desc: 'Переключить фонарик/лазер без меню' },
      { cmd: 'bind , "inventory.toggle;craft.toggle"', desc: 'Инвентарь + окно крафта разом' },
    ],
  },
];
