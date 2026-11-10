// Precios en centavos. Fuente: Menú Pizzetas 2026, páginas 2–14.
// Imágenes extraídas del mismo PDF; algunas representan la categoría.
export const categories = [
  { id: 'pizzas', name: 'Pizzas', subtitle: 'Una especialidad. O mitad y mitad.', icon: 'pizza' },
  { id: 'pastas', name: 'Pastas y más', subtitle: 'Un antojo con mucho sabor.', icon: 'utensils' },
  { id: 'snacks', name: 'Snacks', subtitle: 'Para acompañar, compartir o no.', icon: 'flame' },
  { id: 'burgers', name: 'Burgers', subtitle: 'Con papas a la francesa y chilli popper.', icon: 'burger' },
  { id: 'postres', name: 'Postres', subtitle: 'Siempre queda espacio para algo dulce.', icon: 'cake' },
  { id: 'bebidas', name: 'Bebidas', subtitle: 'Algo fresco para tu pedido.', icon: 'cup' },
  { id: 'bar', name: 'Cervezas', subtitle: 'Elige tu cerveza favorita.', icon: 'cup' },
  { id: 'infantil', name: 'Peques', subtitle: 'Un menú a su medida.', icon: 'sparkles' },
];

const products = [];
function add(id, category, name, price, description = '', options = {}) {
  products.push({ id, category, name, description, variants: [{ name: 'Regular', price: price * 100 }], available: true, ...options });
}
function variants(entries) { return entries.map(([name, price]) => ({ name, price: price * 100 })); }
function choices(label, values) { return [{ label, values }]; }
const pizzaRows = [
  ['peperoni', 'Peperoni', 150, 260, 'Peperoni y mozzarella.'],
  ['tropical', 'Tropical', 155, 270, 'Mozzarella, piña y jamón.'],
  ['vegetariana', 'Vegetariana', 155, 270, 'Piña, morrón, champiñones, cebolla y aceitunas negras.'],
  ['tres-quesos', '3 quesos', 155, 270, 'Mozzarella, gouda, manchego y especias.'],
  ['mexicana', 'Mexicana', 160, 280, 'Longaniza, cebolla, serrano y aguacate.'],
  ['ranchera', 'Ranchera', 160, 280, 'Longaniza, champiñones, cebolla y serrano.'],
  ['carnes-frias', 'Carnes frías', 160, 280, 'Salami, jamón y tocino.'],
  ['nortena', 'Norteña', 160, 280, 'Jamón, bistec, cebolla y morrón.'],
  ['especial', 'Especial', 165, 290, 'Jamón, piña, champiñones, cebolla y tocino.'],
  ['suprema', 'Suprema', 165, 290, 'Jamón, champiñones, cebolla, morrón y tocino.'],
  ['extrema', 'Extrema', 165, 290, 'Salami, peperoni, jamón, cebolla, morrón y champiñones.'],
  ['pastor', 'Pastor', 175, 300, 'Pastor, piña, cebolla y cilantro.'],
  ['boneless-pizza', 'Boneless', 185, 310, 'Mozzarella acompañada de boneless.'],
  ['yecapizza', 'Yecapizza', 175, 300, 'Cecina de Yecapixtla, serrano, aguacate y cebolla caramelizada.'],
  ['capricciosa', 'Capricciosa', 195, 320, 'Jamón serrano, jitomate deshidratado, queso de cabra y aceitunas negras.'],
];
for (const [id, name, personal, grande, description] of pizzaRows) {
  add(id, 'pizzas', name, personal, description, { variants: variants([['Personal', personal], ['Grande', grande]]), image: 'pizza', page: name === 'Norteña' || pizzaRows.findIndex(p => p[0] === id) > 6 ? 3 : 2, tags: ['pizza', 'mozzarella'], baseDescription: 'Con salsa de jitomate y mozzarella.' });
}
const sauces = ['Tamarindo habanero', 'Mango habanero', 'BBQ', 'Buffalo', 'Limón pimienta', 'Parmesano'];
const fillings = ['Queso con espinacas', 'Carne', 'Queso con elote', 'Queso con jitomate deshidratado'];
add('alfredo', 'pastas', 'Alfredo', 160, 'Crema, mantequilla, parmesano y perejil. Incluye dos panes de ajo.', { image: 'pasta', page: 4 });
add('fungi', 'pastas', 'Fungi', 160, 'Pasta cremosa con champiñones frescos y dos panes de ajo.', { page: 4 });
add('carbonara', 'pastas', 'Carbonara', 160, 'Crema, mantequilla, parmesano y tocino. Con dos panes de ajo.', { page: 4 });
add('camarones', 'pastas', 'Pasta con camarones', 195, 'Con dos piezas de pan de ajo.', { choices: choices('Salsa', ['Crema', 'Chipotle']), page: 4 });
add('bolognesa', 'pastas', 'Bolognesa de la casa', 170, 'Carne molida en salsa de jitomate, crema y manchego gratinado. Con dos panes de ajo.', { page: 4 });
add('empanadas-casa', 'pastas', 'Empanadas de la casa', 280, 'Con una ración de carnes frías, quesos y ensalada.', { image: 'empanadas', page: 4, advisory: 'Consulta con el negocio los rellenos y piezas incluidos.' });
add('empanada', 'pastas', 'Empanada individual', 45, 'Una pieza, elige tu relleno.', { choices: choices('Relleno', fillings), page: 4 });
add('ensalada-chef', 'pastas', 'Ensalada del chef', 150, 'Lechugas, espinaca, pollo a la plancha, queso, crotones, manzana y semillas de girasol.', { page: 5 });
add('ensalada-frutal', 'pastas', 'Frutal de la casa', 140, 'Lechugas, fresa, kiwi, mango de temporada, arándanos, nuez y ajonjolí.', { page: 5 });
add('pan-ajo', 'pastas', 'Pan de ajo', 105, 'Tapitas de pan artesanal perfumado con especias.', { page: 5 });
add('pan-gratinado', 'pastas', 'Pan de ajo gratinado', 120, 'Con especias y queso parmesano.', { page: 5 });
add('tapas-queso', 'pastas', 'Tapas de queso de cabra', 110, 'Seis tapitas de pan de ajo con queso de cabra.', { page: 5 });
add('tapas-serrano', 'pastas', 'Tapas de jamón serrano', 150, 'Seis tapitas con queso de cabra y jamón serrano.', { image: 'tapas', page: 5 });
add('alitas', 'snacks', 'Alitas', 160, 'Diez piezas con tu salsa favorita.', { choices: choices('Salsa', [...sauces, 'Salsa macha', 'De la casa']), page: 6 });
add('boneless', 'snacks', 'Boneless', 160, 'Elige la salsa que se te antoje.', { choices: choices('Salsa', sauces), page: 6 });
add('dedos', 'snacks', 'Dedos de queso', 130, 'Crujientes por fuera, queso por dentro.', { variants: variants([['6 piezas', 130], ['8 piezas', 160], ['10 piezas', 180]]), page: 6 });
add('aros', 'snacks', 'Aros de cebolla', 110, '', { variants: variants([['9 piezas', 110], ['12 piezas', 120], ['15 piezas', 130]]), page: 6 });
add('papas-casa', 'snacks', 'Papas de la casa', 110, 'Gratinadas con manchego, tocino y especias.', { variants: variants([['Francesa', 110], ['Gajo', 115]]), page: 6 });
add('nachos', 'snacks', 'Nachos de la casa', 130, 'Totopos con frijoles, manchego gratinado y chiles en escabeche.', { page: 7 });
add('nachos-carne', 'snacks', 'Nachos con carne', 150, 'Frijoles, manchego y chiles en escabeche.', { choices: choices('Carne', ['Pastor', 'Bistec', 'Longaniza']), page: 7 });
for (const [id,name,price] of [['papas','Papas a la francesa',85],['gajo','Papas gajo',95],['raquet','Papas raquet',110],['nuggets','Nuggets',85],['poppers','Chiles poppers',85]]) add(id,'snacks',name,price,'',{page:7});
add('costillitas', 'snacks', 'Costillitas', 230, 'Bañadas en la salsa que elijas.', { choices: choices('Salsa', sauces), page: 7 });
add('charola-mix', 'snacks', 'Charola mix', 310, 'Aros, dedos de queso, alitas, boneless, papas francesa y gajo, ranch y vegetales.', { image: 'mix', page: 8 });
add('costillitas-mix', 'snacks', 'Costillitas mix', 350, 'Aros, dedos de queso, papas, guacamole y costillitas.', { choices: choices('Salsa de costillitas', sauces), page: 8 });
add('pizza-mix', 'snacks', 'Pizza mix', 360, 'Pizza de peperoni, dedos de queso, alitas, boneless, papas raquet y vegetales.', { choices: [{ label: 'Salsa de alitas', values: [...sauces, 'Salsa macha', 'De la casa'] }, { label: 'Salsa de boneless', values: sauces }], page: 8 });
for (const [id,name,price,description] of [
  ['cheese','Cheese burger',170,'150 g de res, lechuga, cebolla, jitomate, mozzarella y tocino.'],
  ['hawaiian','Hawaiian burger',180,'150 g de res, lechuga, cebolla, jitomate, mozzarella, tocino y piña.'],
  ['onion','Onion rings burger',190,'150 g de res, salsa BBQ, mozzarella y aros de cebolla.'],
  ['boneless-burger','Boneless burger',200,'150 g de res, lechuga, cebolla, jitomate, mozzarella y boneless.'],
]) add(id,'burgers',name,price,description,{image:id==='cheese'?'burger':undefined,page:9,...(id==='boneless-burger'?{choices:choices('Salsa de boneless',sauces)}:{})});
const sweet = ['Nutella','Cajeta','Lechera','Fresa','Zarzamora','Hershey'];
add('crepa-sencilla','postres','Crepa o waffle sencillo',90,'Elige la base y tu sabor.',{image:'crepa',choices:[{label:'Base',values:['Crepa','Waffle']},{label:'Sabor',values:sweet}],page:10});
add('crepa-combinada','postres','Crepa o waffle combinado',110,'Nutella, Philadelphia, plátano, fresa, durazno y helados de vainilla o chocolate.',{choices:choices('Base',['Crepa','Waffle']),advisory:'Confirma tu combinación con el negocio por WhatsApp.',page:10});
add('crepa-salada','postres','Crepa o waffle salado',99,'Un antojo salado.',{choices:[{label:'Base',values:['Crepa','Waffle']},{label:'Relleno',values:['Manchego con jamón','Philadelphia con jamón']}],page:10});
add('crepa-especial','postres','Crepa o waffle especial',110,'Crepizza, hawaiana o tropical.',{choices:[{label:'Base',values:['Crepa','Waffle']},{label:'Especialidad',values:['Crepizza','Hawaiana','Tropical']}],page:10});
for(const [id,name,price] of [['waffle-especial','Waffle especial',130],['elote','Pan de elote',75],['platanos','Plátanos fritos',65],['duraznos','Duraznos con lechera',60],['mini-pastel','Mini pastel',150],['volcan','Volcán de chocolate',120]]) add(id,'postres',name,price,'',{image:id==='volcan'?'postre':undefined,page:10});
add('vitrina','postres','Postres de vitrina',40,'Sujetos a disponibilidad.',{choices:choices('Postre',['Carlota','Cheesecake Oreo','Flan en vaso','Tapioca','Gelatina']),page:10});
add('capuccino','bebidas','Capuccino',68,'',{page:10});
add('americano','bebidas','Café americano',35,'',{page:10});
add('frappe','bebidas','Frappé sencillo',90,'',{choices:choices('Sabor',['Moka','Capuccino','Oreo','Mazapán']),page:10});
add('frappe-especial','bebidas','Frappé especial',110,'',{choices:choices('Sabor',['Magnum','Mordisko','Ferrero','Kit Kat']),page:10});
add('refresco','bebidas','Refresco',40,'Consulta los sabores disponibles.',{page:11});
add('citrico','bebidas','Limonada o naranjada',60,'Natural o mineral.',{variants:variants([['Natural',60],['Mineral',65],['Jarra natural',180],['Jarra mineral',250]]),choices:choices('Sabor',['Limón','Naranja']),page:11});
add('agua-sabor','bebidas','Agua fresca de sabor',30,'Consulta el sabor del día.',{variants:variants([['Individual',30],['Jarra',120]]),page:11});
add('agua','bebidas','Agua 600 ml',30,'',{page:11});
add('clamato','bebidas','Clamato preparado',75,'',{variants:variants([['Chico',75],['Grande',120]]),page:11});
add('chamoyada','bebidas','Chamoyada',70,'',{choices:choices('Sabor',['Fresa','Mango','Pepino','Piña']),page:11});
add('pelon','bebidas','Chamoyada de Pelón',85,'Con paleta de Pelón Pelo Rico.',{page:11});
add('rusa','bebidas','Rusa',60,'',{variants:variants([['Chica',60],['Grande',85]]),page:11});
add('malteada','bebidas','Malteada',65,'',{choices:choices('Sabor',['Fresa','Chocolate']),page:11});
const beers=['Corona','Victoria','Heineken','Tecate Light','Tecate Roja','Ultra','Indio','XX Lager'];
add('cerveza','bar','Cerveza 355 ml',50,'',{choices:choices('Marca',beers),page:11});
add('mega','bar','Cerveza mega',100,'',{choices:choices('Marca',['Corona','Victoria','XX Lager','Heineken','Tecate Light']),page:11});
add('bohemia','bar','Cerveza Bohemia',55,'',{page:11});
add('modelo','bar','Cerveza Modelo Especial',55,'',{page:11});
add('tarro','bar','Tarro preparado',10,'Preparación del tarro; cerveza por separado.',{variants:variants([['Cubano',10],['Limón michelado',15],['Clamato',25]]),page:11});
for(const [id,name,bottle,cup] of [['lambrusco','Lambrusco',400,95],['finca','Finca Las Moras',441,110],['casillero','Casillero del Diablo',504,121]]) add(id,'bar',`Vino ${name}`,cup,'',{variants:variants([['Copa',cup],['Botella',bottle]]),page:11});
for(const [id,name,pitcher,cup] of [['casa','De la casa',350,90],['rosado','Rosado',360,95],['rojos','Frutos rojos',400,150],['lambrusco','Lambrusco',500,140],['finca','Finca Las Moras',550,145],['casilleros','Casilleros',600,155]]) add(`clericot-${id}`,'bar',`Clericot ${name}`,cup,'',{variants:variants([['Copa',cup],['Jarra',pitcher]]),page:11});
add('margarita','bar','Margarita',120,'',{choices:choices('Sabor',['Tradicional','Blue','Japonesa','Piña','Maracuyá','Pepino','Fresa']),page:12});
for(const [id,name,price] of [['pina-colada','Piña colada',120],['pink-colada','Pink colada',130],['baileys','Baileys colado de la casa',120],['coco','Coco cielo',130],['habana','Luces de Habana',110],['pink-tonic','Pink tonic',105],['bloody','Blody Mary',110],['carajillo','Carajillo',105],['paloma','Paloma tradicional',85],['sangria-vino','Sangría con vino',150],['sangria','Sangría natural',100],['alfonso','Alfonso XIII',105],['laguna','Laguna azul',105],['perla','Perla negra',105],['conga','Conga',100],['margarichelada','Margarichelada',150]]) add(id,'bar',name,price,'',{page:12});
add('gintonic','bar','Gintonic frutal',105,'',{choices:choices('Sabor',['Limón','Mandarina','Naranja','Pepino']),page:12});
add('mojito','bar','Mojito',110,'',{variants:variants([['Frutal',110],['Frapeado',120]]),choices:choices('Sabor',['Limón','Pepino','Mango','Fresa','Frutos rojos','Maracuyá']),page:12});
for(const [id,name,bottle,cup] of [['jack','Jack Daniels',900,90],['red','Red Label',850,95],['bacardi','Bacardí',700,70],['smirnof','Smirnof',700,70],['absolut','Absolut',950,95],['azul','Tequila Azul',700,70],['cuervo','Tequila José Cuervo',750,75],['don-julio','Don Julio 70',1500,150],['buchanans','Buchanans 12',1300,130],['torres','Torres 10',900,90],['1800','Tequila 1800',1100,95]]) add(id,'bar',name,cup,'Las botellas incluyen cuatro mezcladores.',{variants:variants([['Copa',cup],['Botella',bottle]]),page:13});
for(const [id,name,description] of [['pizza-kids','Pizza kids','Pizza mini'],['burger-kids','Mini burger','Mini hamburguesa'],['nuggets-kids','Nuggets kids','Mini nuggets']]) add(id,'infantil',name,149,`${description}, papas a la francesa, jugo chico y regalo sorpresa.`,{image:id==='pizza-kids'?'kids':undefined,page:14});

// Conservar el catálogo histórico; la carta ofrece únicamente estas cervezas.
const beerIds = new Set(['cerveza','mega','bohemia','modelo']);
for (const product of products) if (product.category === 'bar' && !beerIds.has(product.id)) product.available = false;
export const catalog = products;
export const pizzaExtras = ['Peperoni','Jamón','Piña','Champiñones','Cebolla','Morrón','Aceitunas negras','Gouda','Manchego','Mozzarella','Longaniza','Serrano','Aguacate','Salami','Tocino','Bistec','Pastor','Cilantro','Boneless','Cecina de Yecapixtla','Cebolla caramelizada','Jamón serrano','Jitomate deshidratado','Queso de cabra'];
export const business = {
  name: 'Pizzetas Artesanales',
  // Completar antes de habilitar pedidos reales. Sin valores ficticios.
  whatsapp: '', bank: '', clabe: '', beneficiary: '', address: '', hours: '',
};
