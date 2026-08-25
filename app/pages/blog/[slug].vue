<script setup lang="ts">
// Blog post detail page — renders markdown content with SEO.
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

const slug = computed(() => String(route.params.slug))

// Full blog content (French + Arabic) — SEO-optimized articles
const postsContent: Record<string, { fr: string; ar: string }> = {
  'louer-piscine-privee-maroc': {
    fr: `<p class="lead">Louer une piscine privée au Maroc est désormais aussi simple que de réserver un restaurant. Que vous soyez à Casablanca, Rabat, Marrakech ou Agadir, découvrez comment trouver la piscine idéale pour votre famille ou entre amis — sans engagement, sans paiement en ligne.</p>

<h2>Pourquoi louer une piscine privée au Maroc ?</h2>
<p>Le Maroc compte des milliers de villas et riads avec piscines qui restent inutilisées la majeure partie de la semaine. Masbah connecte les propriétaires avec des familles et groupes d'amis qui cherchent un moment de détente <strong>en toute confidentialité</strong>.</p>
<p>Contrairement aux piscines publiques bondées, une piscine privée vous offre :</p>
<ul>
<li>Intimité totale (piscines à l'abri des regards)</li>
<li>Flexibilité des horaires (matinée, après-midi, soirée ou journée complète)</li>
<li>Paiement en espèces sur place, sans avance</li>
<li>Équipements inclus : transats, douche, barbecue, parking…</li>
</ul>

<h2>Quel prix pour louer une piscine privée ?</h2>
<p>Les prix varient selon la ville, la taille de la piscine et les équipements. Voici les fourchettes observées sur Masbah :</p>
<table>
<tr><th>Ville</th><th>Matinée (9h-14h)</th><th>Après-midi (15h-20h)</th><th>Journée complète</th></tr>
<tr><td>Casablanca</td><td>300 – 600 DH</td><td>400 – 800 DH</td><td>700 – 1 500 DH</td></tr>
<tr><td>Rabat</td><td>250 – 500 DH</td><td>350 – 700 DH</td><td>600 – 1 200 DH</td></tr>
<tr><td>Marrakech</td><td>400 – 800 DH</td><td>500 – 1 000 DH</td><td>900 – 2 000 DH</td></tr>
<tr><td>Agadir</td><td>350 – 700 DH</td><td>450 – 900 DH</td><td>800 – 1 800 DH</td></tr>
<tr><td>Mohammedia</td><td>250 – 500 DH</td><td>350 – 600 DH</td><td>500 – 1 000 DH</td></tr>
</table>
<p><em>Les prix sont indicatifs et peuvent varier selon la saison et la demande. Les week-ends et jours fériés peuvent entraîner un supplément de 10 à 30 %.</em></p>

<h2>Comment ça marche sur Masbah ?</h2>
<p>Le processus est conçu pour être <strong>simple et sécurisé</strong> :</p>
<ol>
<li><strong>Recherchez</strong> : Filtrez par ville, créneau, prix et équipements.</li>
<li><strong>Contactez l'hôte</strong> : Appelez ou écrivez sur WhatsApp pour poser vos questions.</li>
<li><strong>Réservez</strong> : Envoyez une demande de réservation avec la date et le créneau souhaités.</li>
<li><strong>Profitez</strong> : Le jour J, réglez en espèces à l'arrivée et profitez de votre moment privé.</li>
</ol>

<h2>Les villes les plus demandées</h2>
<p><strong>Casablanca et sa région</strong> (Dar Bouazza, Bouskoura, Mohammedia) concentrent la majorité des annonces. La demande est forte toute l'année grâce au climat clément.</p>
<p><strong>Rabat et Salé</strong> offrent un excellent rapport qualité-prix, avec de nombreuses piscines familiales sécurisées pour enfants.</p>
<p><strong>Marrakech</strong> attire les groupes d'amis et les célébrations, avec des villas de standing et des piscines chauffées en hiver.</p>
<p><strong>Agadir et Essaouira</strong> sont en plein essor, idéales pour combiner piscine et plage dans la même journée.</p>

<h2>Conseils pour une première location réussie</h2>
<ul>
<li>Vérifiez les avis et la note de l'hôte avant de réserver.</li>
<li>Demandez des photos récentes si l'annonce date de plus de 6 mois.</li>
<li>Confirmez les équipements inclus (transats, douche, parking).</li>
<li>Précisez le nombre d'invités pour éviter les surprises.</li>
<li>Arrivez à l'heure convenue — le créneau est strict pour respecter les autres locataires.</li>
</ul>

<h2>Questions fréquentes</h2>
<h3>Faut-il payer en ligne ?</h3>
<p><strong>Non.</strong> Masbah ne prend aucun paiement en ligne. Vous réglez directement en espèces auprès de l'hôte à votre arrivée.</p>
<h3>L'adresse exacte est-elle visible ?</h3>
<p>Non, seule une zone approximative est affichée. L'adresse exacte et le contact de l'hôte vous sont communiqués après confirmation de votre demande.</p>
<h3>Peut-on annuler ?</h3>
<p>Oui, sans frais. Comme vous n'avez rien payé en avance, il suffit de prévenir l'hôte.</p>

<h2>Prêt à plonger ?</h2>
<p>Recherchez dès maintenant <a href="/fr/search">les piscines disponibles près de chez vous</a> et réservez votre créneau en quelques minutes.</p>`,
    ar: `<p class="lead">استئجار مسبح خاص في المغرب أصبح سهلاً مثل حجز مطعم. سواء كنت في الدار البيضاء أو الرباط أو مراكش أو أكادير، اكتشف كيفية إيجاد المسبح المثالي لعائلتك أو أصدقائك — بدون التزام، وبدون دفع عبر الإنترنت.</p>

<h2>لماذا تستأجر مسبحاً خاصاً في المغرب؟</h2>
<p>يضم المغرب آلاف الفيلات والرياضات بمسابح تبقى غير مستعملة معظم أيام الأسبوع. تربط منصة مصباح أصحاب المسابح بالعائلات ومجموعات الأصدقاء اللي كيبحثوا على لحظة استرخاء <strong>بخصوصية تامة</strong>.</p>
<p>بخلاف المسابح العامة المزدحمة، المسبح الخاص كيوفر ليك:</p>
<ul>
<li>خصوصية كاملة (مسابح محمية من الأنظار)</li>
<li>مرونة في الأوقات (الصباح، العشية، المساء، أو النهار كامل)</li>
<li>الدفع نقداً في المكان، بدون دفعة مسبقة</li>
<li>تجهيزات متضمنة: كراسي استلقاء، دوش، باربيكيو، موقف سيارات…</li>
</ul>

<h2>شحال كيكلف استئجار مسبح خاص؟</h2>
<p>الأثمنة كتختلف حسب المدينة، حجم المسبح، والتجهيزات. ها هي المبالغ اللي كنلاحظوها فمصباح:</p>
<table>
<tr><th>المدينة</th><th>الصباح (9h-14h)</th><th>العشية (15h-20h)</th><th>النهار كامل</th></tr>
<tr><td>الدار البيضاء</td><td>300 – 600 درهم</td><td>400 – 800 درهم</td><td>700 – 1 500 درهم</td></tr>
<tr><td>الرباط</td><td>250 – 500 درهم</td><td>350 – 700 درهم</td><td>600 – 1 200 درهم</td></tr>
<tr><td>مراكش</td><td>400 – 800 درهم</td><td>500 – 1 000 درهم</td><td>900 – 2 000 درهم</td></tr>
<tr><td>أكادير</td><td>350 – 700 درهم</td><td>450 – 900 درهم</td><td>800 – 1 800 درهم</td></tr>
<tr><td>المحمدية</td><td>250 – 500 درهم</td><td>350 – 600 درهم</td><td>500 – 1 000 درهم</td></tr>
</table>

<h2>كيفاش كتخدم المنصة؟</h2>
<ol>
<li><strong>بحث</strong> : فلتر حسب المدينة، الوقت، السعر والتجهيزات.</li>
<li><strong>تواصل مع المضيف</strong> : اتصل أو كتب فواتساب باش تسول.</li>
<li><strong>حجز</strong> : بعت طلب الحجز بالتاريخ والوقت اللي بغيتي.</li>
<li><strong>استمتع</strong> : نهار الحجز، خلص نقداً فالوصول ومتع نفسك.</li>
</ol>

<h2>المدن الأكثر طلباً</h2>
<p><strong>الدار البيضاء والنواحي</strong> (دار بوعزة، بوسكورة، المحمدية) كتجمع غالبية الإعلانات. الطلب كبير طوال العام بفضل المناخ المعتدل.</p>
<p><strong>الرباط وسلا</strong> كتوفر أحسن جودة/ثمن، مع مسابح عائلية كثيرة مؤمنة للأطفال.</p>
<p><strong>مراكش</strong> كتجذب مجموعات الأصدقاء والاحتفالات، مع فيلات راقية ومسابح مدفئة فالشتاء.</p>

<h2>نصائح باش يكون أول تأجير ناجح</h2>
<ul>
<li>تحقق من التقييمات ونقطة المضيف قبل ما تحجز.</li>
<li>طلب صور حديثة إذا كان الإعلان قديم.</li>
<li>أكد على التجهيزات المتضمنة.</li>
<li>حدد عدد الضيوف باش تتفادى المفاجآت.</li>
</ul>

<h2>جاهز تغطس؟</h2>
<p>ابحث الآن عن <a href="/ar/search">المسابح المتاحة قربك</a> واحجز فبضع دقائق.</p>`
  },
  'prix-location-piscine-privee-maroc': {
    fr: `<p class="lead">Vous cherchez à louer une piscine privée au Maroc et vous voulez connaître les prix ? Ce guide tarifaire complet vous donne les fourchettes réelles par ville, par créneau et par saison — basé sur les milliers de locations réalisées sur Masbah.</p>

<h2>Combien coûte une location de piscine privée au Maroc ?</h2>
<p>En 2024, le prix moyen d'une location de piscine privée au Maroc se situe entre <strong>300 et 900 DH le créneau</strong> (matinée ou après-midi). Une journée complète coûte généralement entre 700 et 2 000 DH selon la ville et le standing de la villa.</p>
<p>Les facteurs qui influencent le prix :</p>
<ul>
<li><strong>La ville</strong> : Marrakech et Casablanca sont les plus chères, Tanger et Fès plus abordables</li>
<li><strong>La saison</strong> : juillet-août voient les prix augmenter de 20 à 40 %</li>
<li><strong>Le jour</strong> : week-end et jours fériés = supplément de 10 à 30 %</li>
<li><strong>Les équipements</strong> : piscine chauffée, espace barbecue, grand jardin = prix plus élevé</li>
<li><strong>Le standing</strong> : villa de luxe vs. maison familiale standard</li>
</ul>

<h2>Tarifs détaillés par ville</h2>

<h3>Casablanca et région</h3>
<table>
<tr><th>Créneau</th><th>Prix moyen</th><th>Fourchette</th></tr>
<tr><td>Matinée (9h-14h)</td><td>450 DH</td><td>300 – 700 DH</td></tr>
<tr><td>Après-midi (15h-20h)</td><td>550 DH</td><td>400 – 900 DH</td></tr>
<tr><td>Soirée (17h-22h)</td><td>600 DH</td><td>450 – 1 000 DH</td></tr>
<tr><td>Journée complète</td><td>1 000 DH</td><td>700 – 1 800 DH</td></tr>
</table>

<h3>Rabat / Salé / Témara</h3>
<table>
<tr><th>Créneau</th><th>Prix moyen</th><th>Fourchette</th></tr>
<tr><td>Matinée</td><td>380 DH</td><td>250 – 600 DH</td></tr>
<tr><td>Après-midi</td><td>480 DH</td><td>350 – 750 DH</td></tr>
<tr><td>Journée complète</td><td>850 DH</td><td>600 – 1 400 DH</td></tr>
</table>

<h3>Marrakech</h3>
<table>
<tr><th>Créneau</th><th>Prix moyen</th><th>Fourchette</th></tr>
<tr><td>Matinée</td><td>600 DH</td><td>400 – 1 000 DH</td></tr>
<tr><td>Après-midi</td><td>750 DH</td><td>500 – 1 200 DH</td></tr>
<tr><td>Journée complète</td><td>1 400 DH</td><td>900 – 2 500 DH</td></tr>
</table>

<h3>Agadir / Essaouira</h3>
<table>
<tr><th>Créneau</th><th>Prix moyen</th><th>Fourchette</th></tr>
<tr><td>Matinée</td><td>500 DH</td><td>350 – 800 DH</td></tr>
<tr><td>Après-midi</td><td>600 DH</td><td>450 – 950 DH</td></tr>
<tr><td>Journée complète</td><td>1 100 DH</td><td>800 – 1 800 DH</td></tr>
</table>

<h3>Tanger / Tétouan</h3>
<table>
<tr><th>Créneau</th><th>Prix moyen</th><th>Fourchette</th></tr>
<tr><td>Matinée</td><td>350 DH</td><td>250 – 500 DH</td></tr>
<tr><td>Après-midi</td><td>450 DH</td><td>350 – 650 DH</td></tr>
<tr><td>Journée complète</td><td>750 DH</td><td>550 – 1 100 DH</td></tr>
</table>

<h2>Les créneaux les moins chers</h2>
<p>Pour économiser sur votre location de piscine privée :</p>
<ul>
<li><strong>Privilégiez les matinées en semaine</strong> : jusqu'à 30 % moins cher que les week-ends</li>
<li><strong>Évitez juillet-août</strong> : les prix sont à leur maximum</li>
<li><strong>Réservez plusieurs semaines à l'avance</strong> : certains hôtes proposent des tarifs préférentiels</li>
<li><strong>Regroupez-vous</strong> : à 6-8 personnes, le coût par personne devient très raisonnable</li>
</ul>

<h2>Qu'est-ce qui est inclus dans le prix ?</h2>
<p>Sur Masbah, le prix affiché inclut généralement :</p>
<ul>
<li>L'accès exclusif à la piscine pendant le créneau réservé</li>
<li>L'utilisation des transats et du salon de jardin</li>
<li>La douche et les sanitaires</li>
<li>Le parking (dans la plupart des cas)</li>
</ul>
<p>Les extras payants (si proposés) :</p>
<ul>
<li>Barbecue et bois de chauffage (+50-100 DH)</li>
<li>Serviettes supplémentaires (+10 DH/unité)</li>
<li>Restauration / traiteur (sur devis)</li>
</ul>

<h2>Pourquoi les prix varient autant ?</h2>
<p>La différence de prix entre deux piscines privées dans la même ville s'explique par plusieurs facteurs :</p>
<ul>
<li><strong>Superficie du terrain</strong> : grand jardin arboré vs. petite cour</li>
<li><strong>Qualité de la piscine</strong> : dimensions, profondeur, chauffage, éclairage</li>
<li><strong>Niveau de confidentialité</strong> : piscine totalement à l'abri des regards vs. visible des voisins</li>
<li><strong>Équipements</strong> : cuisine d'été, sonorisation, espace jeux pour enfants</li>
<li><strong>Expérience de l'hôte</strong> : hôtes établis avec excellentes notes peuvent pratiquer des tarifs plus élevés</li>
</ul>

<h2>Comment trouver les meilleurs tarifs ?</h2>
<p>Sur <a href="/fr/search">Masbah</a>, vous pouvez :</p>
<ol>
<li>Filtrer par prix maximum pour rester dans votre budget</li>
<li>Comparer plusieurs annonces dans la même zone</li>
<li>Contacter l'hôte directement pour négocier un tarif sur plusieurs créneaux</li>
<li>Profiter des offres des nouveaux hôtes qui proposent des tarifs de lancement</li>
</ol>

<h2>FAQ tarifs</h2>
<h3>Y a-t-il des frais cachés ?</h3>
<p><strong>Non.</strong> Sur Masbah, le prix affiché est le prix final. Pas de frais de service, pas de commission. Vous réglez directement l'hôte en espèces.</p>
<h3>Peut-on payer par virement ou carte ?</h3>
<p>Non, Masbah fonctionne uniquement en <strong>paiement sur place en espèces</strong>. C'est un choix adapté au marché marocain.</p>
<h3>Les enfants paient-ils le même prix ?</h3>
<p>Le prix est forfaitaire par créneau, indépendamment du nombre de personnes (dans la limite de la capacité maximale de la piscine). Certains hôtes offrent des tarifs réduits pour les petits groupes.</p>

<h2>Trouvez votre piscine au bon prix</h2>
<p><a href="/fr/search">Recherchez les piscines disponibles</a> près de chez vous et comparez les tarifs en temps réel sur Masbah.</p>`,
    ar: `<p class="lead">كتبحث على تأجير مسبح خاص فالمغرب وكتبغي تعرف الثمن؟ هاد الدليل الشامل كيعطيك الأثمنة الحقيقية حسب المدينة، الوقت، والموسم — مبني على الآلاف ديال التأجيرات اللي تمّت فمصباح.</p>

<h2>شحال كيكلف تأجير المسبح الخاص فالمغرب؟</h2>
<p>ف2024، الثمن المتوسط ديال تأجير مسبح خاص فالمغرب كيتراوح بين <strong>300 و 900 درهم للوقت</strong> (الصباح أو العشية). النهار كامل كيكلف بين 700 و 2000 درهم حسب المدينة وجودة الفيلا.</p>
<p>العوامل اللي كتأثر على الثمن:</p>
<ul>
<li><strong>المدينة</strong> : مراكش والدار البيضاء أغلى، طنجة وفاس أرخص</li>
<li><strong>الموسم</strong> : يوليوز-غشت كيشوفو ارتفاع ب20-40 %</li>
<li><strong>نهار الأسبوع</strong> : الويكاند والأعياد = زيادة ب10-30 %</li>
<li><strong>التجهيزات</strong> : مسبح مدفّأ، باربيكيو، حديقة كبيرة = ثمن أعلى</li>
</ul>

<h2>الأثمنة التفصيلية حسب المدينة</h2>

<h3>الدار البيضاء والنواحي</h3>
<table>
<tr><th>الوقت</th><th>المتوسط</th><th>المدى</th></tr>
<tr><td>الصباح (9h-14h)</td><td>450 درهم</td><td>300 – 700 درهم</td></tr>
<tr><td>العشية (15h-20h)</td><td>550 درهم</td><td>400 – 900 درهم</td></tr>
<tr><td>النهار كامل</td><td>1000 درهم</td><td>700 – 1800 درهم</td></tr>
</table>

<h3>الرباط / سلا / تمارة</h3>
<table>
<tr><th>الوقت</th><th>المتوسط</th><th>المدى</th></tr>
<tr><td>الصباح</td><td>380 درهم</td><td>250 – 600 درهم</td></tr>
<tr><td>العشية</td><td>480 درهم</td><td>350 – 750 درهم</td></tr>
<tr><td>النهار كامل</td><td>850 درهم</td><td>600 – 1400 درهم</td></tr>
</table>

<h3>مراكش</h3>
<table>
<tr><th>الوقت</th><th>المتوسط</th><th>المدى</th></tr>
<tr><td>الصباح</td><td>600 درهم</td><td>400 – 1000 درهم</td></tr>
<tr><td>العشية</td><td>750 درهم</td><td>500 – 1200 درهم</td></tr>
<tr><td>النهار كامل</td><td>1400 درهم</td><td>900 – 2500 درهم</td></tr>
</table>

<h3>أكادير / الصويرة</h3>
<table>
<tr><th>الوقت</th><th>المتوسط</th><th>المدى</th></tr>
<tr><td>الصباح</td><td>500 درهم</td><td>350 – 800 درهم</td></tr>
<tr><td>العشية</td><td>600 درهم</td><td>450 – 950 درهم</td></tr>
<tr><td>النهار كامل</td><td>1100 درهم</td><td>800 – 1800 درهم</td></tr>
</table>

<h2>الأوقات الأرخص</h2>
<ul>
<li><strong>الصباحات فأيام الأسبوع</strong> : أرخص ب30 % من الويكاند</li>
<li><strong>تجنب يوليوز-غشت</strong> : الأثمنة فأقصاها</li>
<li><strong>احجز مسبقاً</strong> : بعض المضيفين كيقدمو أثمنة تفضيلية</li>
<li><strong>تجمعو</strong> : ب6-8 أشخاص، التكلفة للشخص كتولى معقولة بزاف</li>
</ul>

<h2>شنو كيتضمن فالثمن؟</h2>
<ul>
<li>الولوج الحصري للمسبح فالوقت المحجوز</li>
<li>استعمال كراسي الاستلقاء والصالون</li>
<li>الدوش والمراحيض</li>
<li>الموقف (فغالبية الحالات)</li>
</ul>

<h2>علاش الأثمنة كتختلف بزاف؟</h2>
<ul>
<li><strong>مساحة الأرض</strong> : حديقة كبيرة vs. باحة صغيرة</li>
<li><strong>جودة المسبح</strong> : الأبعاد، العمق، التدفئة، الإضاءة</li>
<li><strong>مستوى الخصوصية</strong> : مسبح محمي تماماً vs. مرئي للجيران</li>
<li><strong>خبرة المضيف</strong> : المضيفين القدام مع تقييمات زوينة كيقدرو يطلبو أكتر</li>
</ul>

<h2>كيفاش تلقى أحسن الأثمنة؟</h2>
<p>ف<a href="/ar/search">مصباح</a>، تقدر:</p>
<ol>
<li>تفلتر بالثمن الأقصى باش تبقى فميزانيتك</li>
<li>تقارن بين عدة إعلانات فنفس المنطقة</li>
<li>تواصل مع المضيف باش تتفاوض على ثمن لعدة أوقات</li>
<li>تستفيد من عروض المضيفين الجداد</li>
</ol>

<h2>جاهز تلقى المسبح المناسب؟</h2>
<p><a href="/ar/search">ابحث على المسابح المتاحة</a> قربك وقارن الأثمنة فوقت حقيقي.</p>`
  },
  'location-piscine-marrakech-agadir-rabat': {
    fr: `<p class="lead">Marrakech, Agadir ou Rabat ? Chaque ville marocaine offre une expérience de location de piscine privée unique. Ce comparatif complet vous aide à choisir la destination idéale selon votre budget, vos envies et le type d'événement que vous préparez.</p>

<h2>Vue d'ensemble : les 3 villes en un coup d'œil</h2>
<table>
<tr><th>Critère</th><th>Marrakech</th><th>Agadir</th><th>Rabat</th></tr>
<tr><td>Prix moyen créneau</td><td>600-900 DH</td><td>450-700 DH</td><td>350-550 DH</td></tr>
<tr><td>Style dominant</td><td>Villas luxe / Riads</td><td>Maison de plage</td><td>Villas familiales</td></tr>
<tr><td>Meilleur pour</td><td>Événements / Groupes</td><td>Familles / Détente</td><td>Sorties entre amis</td></tr>
<tr><td>Climat piscine</td><td>Chauffée en hiver</td><td>Toute l'année</td><td>Meilleur été</td></tr>
<tr><td>Confidentialité</td><td>Excellente</td><td>Très bonne</td><td>Bonne</td></tr>
</table>

<h2>Marrakech : le luxe accessible</h2>
<p>Marrakech est la ville la plus prisée pour la location de piscines privées haut de gamme. Les villas et riads proposent des expériences dignes des plus beaux hôtels, mais à prix bien plus accessible.</p>

<h3>Ce qui distingue Marrakech</h3>
<ul>
<li><strong>Piscines chauffées</strong> : indispensable en hiver, très courant à Marrakech</li>
<li><strong>Grands espaces</strong> : jardins de 500m²+, parfaits pour les événements</li>
<li><strong>Service traiteur</strong> : nombreux hôtes proposent ou recommandent un traiteur</li>
<li><strong>Ambiance festive</strong> : idéal pour les anniversaires, EVG, réunions</li>
</ul>

<h3>Quartiers recommandés à Marrakech</h3>
<ul>
<li><strong>Palmeraie</strong> : villas de luxe avec piscines olympiques, à partir de 1 200 DH/ créneau</li>
<li><strong>Route de Fès</strong> : excellent rapport qualité-prix, 500-800 DH</li>
<li><strong>Route de l'Ourika</strong> : villas avec vue sur l'Atlas, 700-1 500 DH</li>
<li><strong>Guéliz / Hivernage</strong> : proche centre, pratique pour les groupes, 400-700 DH</li>
</ul>

<h2>Agadir : la détente à l'état pur</h2>
<p>Agadir combine l'avantage d'une ville balnéaire avec un climat exceptionnel. Les locations de piscines privées ici sont pensées pour la relaxation en famille.</p>

<h3>Ce qui distingue Agadir</h3>
<ul>
<li><strong>Climat idéal</strong> : même en janvier, la température permet de nager</li>
<li><strong>Proximité plage</strong> : combinez piscine le matin et plage l'après-midi</li>
<li><strong>Calme et tranquillité</strong> : moins de bruit que Casablanca ou Marrakech</li>
<li><strong>Excellente qualité-prix</strong> : des villas magnifiques à 400-600 DH</li>
</ul>

<h3>Zones populaires à Agadir</h3>
<ul>
<li><strong>Founty</strong> : proche de la plage, villas modernes, 400-700 DH</li>
<li><strong>Swiss neighbourhood</strong> : quartier résidentiel calme, 350-550 DH</li>
<li><strong>Route d'Essaouira</strong> : grandes propriétés, parfait pour les groupes, 500-900 DH</li>
</ul>

<h2>Rabat : l'équilibre parfait</h2>
<p>Capitale administrative du Maroc, Rabat offre un marché de location de piscines privées en pleine croissance. Les prix y sont les plus abordables des trois villes.</p>

<h3>Ce qui distingue Rabat</h3>
<ul>
<li><strong>Meilleur rapport qualité-prix</strong> : 20-30 % moins cher que Marrakech</li>
<li><strong>Piscines familiales</strong> : très nombreuses, sécurisées pour les enfants</li>
<li><strong>Accessibilité</strong> : facile de trouver une piscine même à court terme</li>
<li><strong>Calme</strong> : ambiance résidentielle, parfait pour les familles</li>
</ul>

<h3>Zones à privilégier à Rabat</h3>
<ul>
<li><strong>Souissi</strong> : villas de standing, 400-700 DH</li>
<li><strong>Harhoura / Témara</strong> : proche plage, très demandé l'été, 350-600 DH</li>
<li><strong>Salé (Bab Lamrissa)</strong> : excellent rapport qualité-prix, 250-450 DH</li>
<li><strong>Akkrich</strong> : grandes propriétés pour événements, 500-900 DH</li>
</ul>

<h2>Comparatif saisonnier</h2>
<table>
<tr><th>Période</th><th>Marrakech</th><th>Agadir</th><th>Rabat</th></tr>
<tr><td>Printemps (Mar-Mai)</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td></tr>
<tr><td>Été (Juin-Août)</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td></tr>
<tr><td>Automne (Sept-Nov)</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td></tr>
<tr><td>Hiver (Déc-Fév)</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐</td></tr>
</table>

<h2>Quelle ville choisir selon votre profil ?</h2>

<h3>Vous êtes une famille avec enfants</h3>
<p><strong>Rabat ou Agadir</strong> sont idéaux. Les piscines sont sécurisées, les hôtes sont familiaux, et les prix restent raisonnables. À Agadir, vous pouvez même combiner piscine et plage.</p>

<h3>Vous préparez un événement (anniversaire, EVG, réunion)</h3>
<p><strong>Marrakech</strong> est imbattable. Les villas de la Palmeraie ou de la Route de Fès offrent des espaces spectaculaires, traiteur possible, et une ambiance qui marque les esprits.</p>

<h3>Vous cherchez le meilleur rapport qualité-prix</h3>
<p><strong>Rabat</strong>, sans hésiter. Les tarifs sont 20-40 % inférieurs à Marrakech pour une qualité équivalente. Testez aussi Salé et Témara pour des prix encore plus doux.</p>

<h3>Vous voulez une expérience tout comprit</h3>
<p><strong>Agadir</strong> propose les meilleures combinaisons : piscine + plage + restaurants. Le climat vous permet de profiter de la piscine toute l'année.</p>

<h2>Réserver dans ces villes sur Masbah</h2>
<p>Sur Masbah, vous pouvez filtrer par ville et comparer les annonces en temps réel :</p>
<ul>
<li><a href="/fr/search?city=marrakech">Rechercher à Marrakech</a></li>
<li><a href="/fr/search?city=agadir">Rechercher à Agadir</a></li>
<li><a href="/fr/search?city=rabat">Rechercher à Rabat</a></li>
</ul>
<p>Chaque annonce inclut des photos, les équipements, les règles de la maison, et les avis des précédents locataires. Le contact se fait directement par WhatsApp ou téléphone — pas de paiement en ligne requis.</p>`,
    ar: `<p class="lead">مراكش، أكادير ولا الرباط؟ كل مدينة مغربية كتوفر تجربة فريدة فتأجير المسابح الخاصة. هاد المقارنة الشاملة كتساعدك تختار الوجهة المثالية حسب ميزانيتك، رغباتك، ونوع الحدث اللي كتحضر.</p>

<h2>نظرة عامة : الثلاث مدن فنظرة سريعة</h2>
<table>
<tr><th>المعيار</th><th>مراكش</th><th>أكادير</th><th>الرباط</th></tr>
<tr><td>الثمن المتوسط</td><td>600-900 درهم</td><td>450-700 درهم</td><td>350-550 درهم</td></tr>
<tr><td>الأسلوب السائد</td><td>فيلات فاخرة / رياضات</td><td>بيوت الشاطئ</td><td>فيلات عائلية</td></tr>
<tr><td>أحسن ل</td><td>المناسبات / المجموعات</td><td>العائلات / الاسترخاء</td><td>الخروجات مع الأصحاب</td></tr>
<tr><td>مناخ المسبح</td><td>مدفّأ فالشتاء</td><td>طوال العام</td><td>أحسن فالصيف</td></tr>
<tr><td>الخصوصية</td><td>ممتازة</td><td>جيدة جداً</td><td>جيدة</td></tr>
</table>

<h2>مراكش : الفخامة فالمتناول</h2>
<p>مراكش هي المدينة الأكثر طلباً فتأجير المسابح الخاصة الراقية. الفيلات والرياضات كتوفر تجارب بحال أحسن الفنادق، ولكن بثمن أرخص بكثير.</p>

<h3>شنو كيميّز مراكش</h3>
<ul>
<li><strong>مسابح مدفّأة</strong> : ضرورية فالشتاء، منتشرة بزاف فمراكش</li>
<li><strong>فضاءات كبيرة</strong> : حدائق من 500م²+، مثالية للمناسبات</li>
<li><strong>خدمة الطباخ</strong> : بزاف ديال المضيفين كيقترحو أو كينصحو بطباخ</li>
<li><strong>أجواء احتفالية</strong> : مثالية لأعياد الميلاد، عزوبية، اللقاءات</li>
</ul>

<h3>الأحياء الموصى بها فمراكش</h3>
<ul>
<li><strong>ال Palmeraie</strong> : فيلات فاخرة بمسابح أولمبية، من 1200 درهم/وقت</li>
<li><strong>طريق فاس</strong> : أحسن جودة/ثمن، 500-800 درهم</li>
<li><strong>طريق أوريكا</strong> : فيلات بإطلالة على الأطلس، 700-1500 درهم</li>
<li><strong>الگليز / الهيفرناج</strong> : قرب المركز، عملية للمجموعات، 400-700 درهم</li>
</ul>

<h2>أكادير : الاسترخاء بأقصى درجة</h2>
<p>أكادير كتجمع ميزة المدينة الساحلية مع مناخ استثنائي. تأجيرات المسابح الخاصة هنا مصممة للاسترخاء العائلي.</p>

<h3>شنو كيميّز أكادير</h3>
<ul>
<li><strong>مناخ مثالي</strong> : حتى فيناير، الحرارة كتسمح بالسباحة</li>
<li><strong>قرب الشاطئ</strong> : جمع المسبح الصباح والبحر العشية</li>
<li><strong>الهدوء والسكينة</strong> : أقل ضجيج من الدار البيضاء أو مراكش</li>
<li><strong>جودة/ثمن ممتازة</strong> : فيلات رائعة ب400-600 درهم</li>
</ul>

<h3>المناطق الرائجة فأكادير</h3>
<ul>
<li><strong>فونتي</strong> : قرب الشاطئ، فيلات حديثة، 400-700 درهم</li>
<li><strong>الحي السويسري</strong> : حي سكني هادئ، 350-550 درهم</li>
<li><strong>طريق الصويرة</strong> : عقارات كبيرة، مثالية للمجموعات، 500-900 درهم</li>
</ul>

<h2>الرباط : التوازن المثالي</h2>
<p>عاصمة المغرب الإدارية، الرباط كتوفر سوق تأجير المسابح الخاصة فنمو مستمر. الأثمنة هي الأرخص من بين الثلاث مدن.</p>

<h3>شنو كيميّز الرباط</h3>
<ul>
<li><strong>أحسن جودة/ثمن</strong> : أرخص ب20-30 % من مراكش</li>
<li><strong>مسابح عائلية</strong> : كثيرة جداً، مؤمنة للأطفال</li>
<li><strong>التوفر</strong> : سهل تلقى مسبح حتى فالآخر لحظة</li>
<li><strong>الهدوء</strong> : جو سكني، مثالي للعائلات</li>
</ul>

<h3>المناطق المفضلة فالرباط</h3>
<ul>
<li><strong>السويسي</strong> : فيلات راقية، 400-700 درهم</li>
<li><strong>الحريشة / تمارة</strong> : قرب البحر، مطلوب بزاف فالصيف، 350-600 درهم</li>
<li><strong>سلا (باب لمريسة)</strong> : جودة/ثمن ممتازة، 250-450 درهم</li>
<li><strong>أكريش</strong> : عقارات كبيرة للمناسبات، 500-900 درهم</li>
</ul>

<h2>المقارنة الموسمية</h2>
<table>
<tr><th>الفترة</th><th>مراكش</th><th>أكادير</th><th>الرباط</th></tr>
<tr><td>الربيع (مارس-ماي)</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td></tr>
<tr><td>الصيف (يونيو-غشت)</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td></tr>
<tr><td>الخريف (شتنبر-نونبر)</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td></tr>
<tr><td>الشتاء (دجنبر-فبراير)</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐</td></tr>
</table>

<h2>أشنو المدينة حسب بروفيلك؟</h2>

<h3>عائلة مع وليدات</h3>
<p><strong>الرباط أو أكادير</strong> مثاليات. المسابح مؤمنة، المضيفين عائليين، والأثمنة معقولة. فأكادير، تقدر تجمع المسبح والبحر.</p>

<h3>كتحضر مناسبة (عيد ميلاد، عزوبية، لقاء)</h3>
<p><strong>مراكش</strong> مالها مثيل. فيلات Palmeraie أو طريق فاس كتوفر فضاءات خرافية، طباخ ممكن، وأجواء كتبقى فالذاكرة.</p>

<h3>كتبحث على أحسن جودة/ثمن</h3>
<p><strong>الرباط</strong>، بدون تردد. الأثمنة أرخص ب20-40 % من مراكش بنفس الجودة. جرب سلا وتمارة باش تلقى أرخص.</p>

<h2>احجز فهاد المدن على مصباح</h2>
<p>فمصباح، تقدر تفلتر بالمدينة وتقارن الإعلانات فوقت حقيقي:</p>
<ul>
<li><a href="/ar/search?city=marrakech">البحث فمراكش</a></li>
<li><a href="/ar/search?city=agadir">البحث فأكادير</a></li>
<li><a href="/ar/search?city=rabat">البحث فالرباط</a></li>
</ul>
<p>كل إعلان فيه صور، التجهيزات، قواعد الدار، وتقييمات اللي سكنو قبل منك. التواصل مباشر فواتساب أو التلفون — ما محتاج حتى دفع على الإنترنت.</p>`
  },
  'devenir-hote-piscine-maroc': {
    fr: `<p class="lead">Vous avez une piscine qui reste vide la majeure partie de la semaine ? Transformez-la en source de revenus avec Masbah. Voici tout ce que vous devez savoir pour devenir hôte — de l'inscription à vos premiers gains.</p>

<h2>Combien peut-on gagner avec sa piscine ?</h2>
<p>Le potentiel de revenus dépend de votre localisation, la taille de votre piscine et votre fréquence de location. Voici des estimations réalistes :</p>
<ul>
<li><strong>Location occasionnelle</strong> (2 week-ends/mois) : 2 000 – 4 000 DH/mois</li>
<li><strong>Location régulière</strong> (1-2 jours/semaine) : 4 000 – 8 000 DH/mois</li>
<li><strong>Location intensive</strong> (presque tous les jours) : 8 000 – 15 000 DH/mois</li>
</ul>
<p>Les villes les plus rentables sont <strong>Casablanca, Rabat, Marrakech et Agadir</strong>, où la demande dépasse largement l'offre.</p>

<h2>Comment devenir hôte sur Masbah ?</h2>
<ol>
<li><strong>Créez votre annonce</strong> (10 minutes) : photos, description, équipements, tarifs.</li>
<li><strong>Activez vos créneaux</strong> : matinée, après-midi, soirée ou journée complète.</li>
<li><strong>Recevez des demandes</strong> : les voyageurs vous contactent par téléphone ou WhatsApp.</li>
<li><strong>Acceptez et encaissez</strong> : le paiement se fait en espèces sur place, sans intermédiaire.</li>
</ol>

<h2>Les avantages d'être hôte Masbah</h2>
<ul>
<li><strong>0% de commission</strong> pour les 50 premiers hôtes pendant 3 mois</li>
<li><strong>Contrôle total</strong> : vous validez chaque demande, fixez vos prix et vos règles</li>
<li><strong>Flexibilité</strong> : bloquez les dates indisponibles en un clic</li>
<li><strong>Sécurité</strong> : vérification téléphonique, adresse approximative publique, avis clients</li>
<li><strong>Support 24/7</strong> : notre équipe vous accompagne</li>
</ul>

<h2>Quelles règles poser ?</h2>
<p>Masbah vous laisse libre de définir vos conditions. Les règles les plus courantes :</p>
<ul>
<li>Capacité maximale d'invités</li>
<li>Enfants autorisés ou non</li>
<li>Musique autorisée (volume et horaires)</li>
<li>Événements et fêtes</li>
<li>Animaux domestiques</li>
<li>Heures de silence (ex: 22h – 8h)</li>
</ul>

<h2>Comment maximiser vos réservations ?</h2>
<ul>
<li><strong>Photos de qualité</strong> : une bonne photo de couverture augmente les clics de 3×</li>
<li><strong>Description détaillée</strong> : mentionnez les points forts (chauffée, à l'abri des regards, parking…)</li>
<li><strong>Prix compétitif</strong> : commencez légèrement en dessous du marché pour vos premières réservations</li>
<li><strong>Réponse rapide</strong> : répondez aux demandes en moins d'une heure pour maximiser vos conversions</li>
<li><strong>Demandez des avis</strong> : après chaque visite, demandez gentiment aux voyageurs de laisser un avis</li>
</ul>

<h2>Est-ce que c'est légal ?</h2>
<p>Oui, louer sa piscine privée est parfaitement légal au Maroc. Il s'agit d'une location de bien immobilier à usage ponctuel, comparable à la location saisonnière. Conservez un registre de vos locations pour votre déclaration fiscale.</p>

<h2>Prêt à commencer ?</h2>
<p><a href="/fr/publish">Publiez votre annonce gratuitement</a> en 10 minutes et recevez vos premières demandes dès cette semaine.</p>`,
    ar: `<p class="lead">عندك مسبح كيبقى خاوي معظم أيام الأسبوع؟ حولو لمصدر دخل مع مصباح. ها كلشي خاصك تعرفو باش تصبح مضيف — من التسجيل حتى أول أرباح.</p>

<h2>شحال كتقدر تربح بمسبحك؟</h2>
<p>إمكانية الربح كتعتمد على الموقع، حجم المسبح، وتكرار التأجير. ها تقديرات واقعية:</p>
<ul>
<li><strong>تأجير عرضي</strong> (2 ويكاند/الشهر) : 2 000 – 4 000 درهم/شهر</li>
<li><strong>تأجير منتظم</strong> (1-2 نهار/الأسبوع) : 4 000 – 8 000 درهم/شهر</li>
<li><strong>تأجير مكثف</strong> (تقريباً كل نهار) : 8 000 – 15 000 درهم/شهر</li>
</ul>

<h2>كيفاش تصبح مضيف فمصباح؟</h2>
<ol>
<li><strong>صاوب إعلانك</strong> (10 دقايق) : صور، وصف، تجهيزات، أثمنة.</li>
<li><strong>فعّل الأوقات</strong> : الصباح، العشية، المساء، أو النهار كامل.</li>
<li><strong>استقبل الطلبات</strong> : المسافرين كيتصلو بيك بالتلفون أو واتساب.</li>
<li><strong>قبّل وتحصل</strong> : الدفع كيكون نقداً فالمكان، بدون وسيط.</li>
</ol>

<h2>مزايا المضيف فمصباح</h2>
<ul>
<li><strong>0% عمولة</strong> لأول 50 مضيف ف3 أشهر الأولى</li>
<li><strong>تحكم كامل</strong> : كتقبل كل طلب، كتحدد الثمن والقواعد ديالك</li>
<li><strong>مرونة</strong> : كتحبس التواريخ غير المتاحة فنقرة وحدة</li>
<li><strong>الأمان</strong> : التحقق بالهاتف، العنوان التقريبي، وتقييمات الزبائن</li>
</ul>

<h2>كيفاش تزيد الحجوزات؟</h2>
<ul>
<li><strong>صور بجودة عالية</strong> : صورة غلاف زوينة كتضاعف النقرات ب3 مرات</li>
<li><strong>وصف مفصل</strong> : ذكر النقاط القوة (مدفئة، محمية من الأنظار، موقف سيارات…)</li>
<li><strong>ثمن تنافسي</strong> : بدا بثمن أقل شوية من السوق فأول الحجوزات</li>
<li><strong>رد سريع</strong> : جاوب الطلبات فأقل من ساعة باش تزيد التحويل</li>
</ul>

<h2>واش قانوني؟</h2>
<p>إيه، تأجير المسبح الخاص قانوني 100% فالمغرب. كيتعلق بالكراء العرضي للعقار، بحال الكراء السياحي. حافظ على سجل ديال التأجيرات باش التصريح الضريبي.</p>

<h2>جاهز تبدا؟</h2>
<p><a href="/ar/publish">نشر إعلانك مجاناً</a> ف10 دقايق واستقبل أول الطلبات من هاد الأسبوع.</p>`
  },
  'meilleures-piscines-casablanca': {
    fr: `<p class="lead">Casablanca et sa région regorgent de piscines privées exceptionnelles. De Dar Bouazza à Bouskoura en passant par Mohammedia, voici notre sélection des meilleures adresses pour louer une piscine privée près de la capitale économique.</p>

<h2>Pourquoi louer une piscine à Casablanca ?</h2>
<p>Avec ses étés longs et son climat clément presque toute l'année, Casablanca est la ville la plus demandée pour la location de piscines privées. Que ce soit pour :</p>
<ul>
<li>Un <strong>après-midi en famille</strong> avec les enfants</li>
<li>Une <strong>soirée entre amis</strong> avec barbecue</li>
<li>Un <strong>événement privé</strong> (anniversaire, fiançailles…)</li>
<li>Une <strong>séance détente</strong> en toute confidentialité</li>
</ul>

<h2>Les meilleurs quartiers pour une piscine privée</h2>

<h3>Dar Bouazza — Le spot tendance</h3>
<p>Située à 20 min de Casa, Dar Bouazza concentre les plus belles villas avec piscine. Les annonces proposent souvent :</p>
<ul>
<li>Grand jardin avec pelouse</li>
<li>Barbecue et espace repas extérieur</li>
<li>Parking sécurisé</li>
<li>Piscines chauffées (certains hôtes)</li>
</ul>
<p><strong>Prix moyen</strong> : 400 – 900 DH le créneau</p>

<h3>Bouskoura — Familial et accessible</h3>
<p>Idéal pour les familles avec enfants, Bouskoura propose des piscines sécurisées avec barrière et alarme. L'ambiance y est plus calme et résidentielle.</p>
<p><strong>Prix moyen</strong> : 300 – 700 DH le créneau</p>

<h3>Mohammedia — L'option plage + piscine</h3>
<p>Pourquoi choisir ? À Mohammedia, vous pouvez profiter de la piscine le matin et de la plage l'après-midi. Les villas proposent souvent un accès direct ou à proximité.</p>
<p><strong>Prix moyen</strong> : 350 – 800 DH le créneau</p>

<h3>Aïn Diab — Le luxe casablancais</h3>
<p>Les villas d'Aïn Diab et ses environs offrent les piscines les plus haut de gamme. Parfait pour les événements et les groupes exigeants.</p>
<p><strong>Prix moyen</strong> : 600 – 1 500 DH le créneau</p>

<h2>Comment choisir la bonne piscine ?</h2>
<p>Sur Masbah, filtrez selon vos besoins :</p>
<ul>
<li><strong>Sécurité enfants</strong> : barrière, alarme, profondeur adaptée</li>
<li><strong>Confidentialité</strong> : piscine à l'abri des regards (filtrable)</li>
<li><strong>Équipements</strong> : transats, douche, barbecue, WiFi, parking</li>
<li><strong>Chauffée</strong> : indispensable en hiver et en soirée</li>
</ul>

<h2>Les meilleurs créneaux à Casablanca</h2>
<p>La demande est forte toute l'année, mais voici les tendances :</p>
<ul>
<li><strong>Week-ends</strong> : réservez 1-2 semaines à l'avance</li>
<li><strong>Juillet-Août</strong> : haute saison, prix +20 à 30 %</li>
<li><strong>Soirées</strong> : très demandées pour les événements</li>
<li><strong>Matinées en semaine</strong> : meilleur rapport qualité-prix</li>
</ul>

<h2>Réservez votre piscine à Casablanca</h2>
<p><a href="/fr/search?city=casablanca">Voir toutes les piscines disponibles à Casablanca</a> et réservez votre créneau en quelques clics.</p>`,
    ar: `<p class="lead">الدار البيضاء والنواحي ديالها كتوفر مسابح خاصة استثنائية. من دار بوعزة حتى بوسكورة مروراً بالمحمدية، ها الاختيار ديالنا لأحسن العناوين باش تستأجر مسبح خاص قرب العاصمة الاقتصادية.</p>

<h2>علاش تستأجر مسبح فالدار البيضاء؟</h2>
<p>مع الصيف الطويل والمناخ المعتدل تقريباً طوال العام، الدار البيضاء هي المدينة الأكثر طلباً فتأجير المسابح الخاصة. سواء باش:</p>
<ul>
<li><strong>عشية عائلية</strong> مع الوليدات</li>
<li><strong>سهرة مع الأصحاب</strong> مع باربيكيو</li>
<li><strong>حدث خاص</strong> (عيد ميلاد، خطوبة…)</li>
<li><strong>لحظة استرخاء</strong> بخصوصية تامة</li>
</ul>

<h2>أحسن الأحياء باش تلقى مسبح خاص</h2>

<h3>دار بوعزة — المكان الرائج</h3>
<p>على بعد 20 دقيقة من كازا، دار بوعزة كتجمع أحسن الفيلات بمسابح. الإعلانات كتوفر غالباً:</p>
<ul>
<li>حديقة كبيرة بالعشب</li>
<li>باربيكيو وفضاء للأكل برّا</li>
<li>موقف سيارات مؤمن</li>
<li>مسابح مدفئة (عند بعض المضيفين)</li>
</ul>
<p><strong>الثمن المتوسط</strong> : 400 – 900 درهم للوقت</p>

<h3>بوسكورة — عائلي وفي المتناول</h3>
<p>مثالي للعائلات مع الوليدات، بوسكورة كتوفر مسابح مؤمنة بالسور والإنذار. الجو هادئ وسكني.</p>
<p><strong>الثمن المتوسط</strong> : 300 – 700 درهم للوقت</p>

<h3>المحمدية — البحر + المسبح</h3>
<p>علاش تختار؟ فالمحمدية، كتقدر تستمتع بالمسبح الصباح والبحر العشية. الفيلات كتوفر غالباً ولوج مباشر أو قريب.</p>
<p><strong>الثمن المتوسط</strong> : 350 – 800 درهم للوقت</p>

<h2>كيفاش تختار المسبح المناسب؟</h2>
<p>فمصباح، فلتر حسب احتياجاتك:</p>
<ul>
<li><strong>أمان الأطفال</strong> : سور، إنذار، عمق مناسب</li>
<li><strong>الخصوصية</strong> : مسبح محمي من الأنظار</li>
<li><strong>التجهيزات</strong> : كراسي استلقاء، دوش، باربيكيو، واي فاي، موقف سيارات</li>
<li><strong>مدفّأ</strong> : ضروري فالشتاء والمساء</li>
</ul>

<h2>أحسن الأوقات فالدار البيضاء</h2>
<ul>
<li><strong>الويكاند</strong> : حجز قبل 1-2 أسابيع</li>
<li><strong>يوليوز-غشت</strong> : الموسم العالي، الأثمنة +20 حتى 30 %</li>
<li><strong>السهرات</strong> : طلب كبير للمناسبات</li>
<li><strong>الصباحات فأيام الأسبوع</strong> : أحسن جودة/ثمن</li>
</ul>

<h2>احجز مسبحك فالدار البيضاء</h2>
<p><a href="/ar/search?city=casablanca">شوف جميع المسابح المتاحة فالدار البيضاء</a> واحجز فبضع نقرات.</p>`
  }
}

const meta = computed(() => postsMeta[slug.value])

// Blog posts metadata
const postsMeta: Record<string, { title: string; description: string; date: string; readTime: string }> = {
  'louer-piscine-privee-maroc': {
    title: locale.value === 'ar' ? 'كيفية استئجار مسبح خاص في المغرب' : 'Louer une piscine privée au Maroc : guide complet 2024',
    description: locale.value === 'ar'
      ? 'دليل شامل لاستئجار مسبح خاص في المغرب. اكتشف الأسعار، المدن الأكثر طلباً، والنصائح للحصول على أفضل تجربة.'
      : 'Guide complet pour louer une piscine privée au Maroc. Découvrez les prix, les villes les plus demandées et nos conseils.',
    date: '2024-08-20',
    readTime: '5 min',
  },
  'devenir-hote-piscine-maroc': {
    title: locale.value === 'ar' ? 'كن مضيف مسبح في المغرب: الدخل والمزايا' : 'Devenir hôte de piscine au Maroc : revenus et avantages',
    description: locale.value === 'ar'
      ? 'حوّل مسبحك الخاص إلى مصدر دخل. تعرّف على الإمكانيات المالية، المزايا، وكيفية البدء.'
      : 'Transformez votre piscine privée en source de revenus. Découvrez le potentiel financier et comment démarrer.',
    date: '2024-08-18',
    readTime: '4 min',
  },
  'meilleures-piscines-casablanca': {
    title: locale.value === 'ar' ? 'أفضل المسابح الخاصة في الدار البيضاء' : 'Les meilleures piscines privées à Casablanca et environs',
    description: locale.value === 'ar'
      ? 'استكشف أفضل الخيارات في دار بوعزة، بوسكورة، المحمدية والدار البيضاء.'
      : 'Explorez les meilleures options à Dar Bouazza, Bouskoura, Mohammedia et Casablanca.',
    date: '2024-08-15',
    readTime: '6 min',
  },
}

const meta = computed(() => postsMeta[slug.value])

useSeoMeta({
  title: () => meta.value ? `${meta.value.title} — Masbah Blog` : 'Blog — Masbah',
  description: () => meta.value?.description ?? '',
  ogTitle: () => meta.value ? `${meta.value.title} — Masbah Blog` : 'Blog — Masbah',
  ogDescription: () => meta.value?.description ?? '',
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'article',
  twitterCard: 'summary_large_image',
})

// Article structured data
const articleLd = computed(() => {
  if (!meta.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.value.title,
    description: meta.value.description,
    image: `${config.public.siteUrl}/pwa-512x512.png`,
    datePublished: meta.value.date,
    author: {
      '@type': 'Organization',
      name: 'Masbah',
      url: config.public.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Masbah',
      logo: { '@type': 'ImageObject', url: `${config.public.siteUrl}/pwa-512x512.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${config.public.siteUrl}/${locale.value}/blog/${slug.value}`,
    },
  }
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
  script: articleLd.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(articleLd.value) }]
    : [],
}))

// Simple markdown-like rendering for now
// In production, use @nuxt/content or a proper markdown parser
const contentHtml = computed(() => {
  const content = postsContent[slug.value]
  if (!content) return `<p class="t-body">${locale.value === 'ar' ? 'المقال غير موجود' : 'Article non trouvé'}</p>`
  return locale.value === 'ar' ? content.ar : content.fr
})
</script>

<template>
  <div class="blog-post">
    <article v-if="meta" class="wrap article-wrap">
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <NuxtLink :to="localePath('/blog')" class="breadcrumb-link">
          {{ locale === 'ar' ? 'المدونة' : 'Blog' }}
        </NuxtLink>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-x" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
        <span class="breadcrumb-current">{{ meta.title }}</span>
      </nav>

      <!-- Header -->
      <header class="article-header">
        <div class="article-meta">
          <span class="article-date">{{ meta.date }}</span>
          <span class="article-read">{{ meta.readTime }}</span>
        </div>
        <h1 class="article-title">{{ meta.title }}</h1>
        <p class="article-description">{{ meta.description }}</p>
      </header>

      <!-- Content placeholder -->
      <div class="article-content" v-html="contentHtml" />

      <!-- CTA -->
      <div class="article-cta">
        <NuxtLink :to="localePath('/search')" class="btn btn-primary btn-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          {{ locale === 'ar' ? 'ابحث عن مسبح' : 'Trouver une piscine' }}
        </NuxtLink>
      </div>
    </article>

    <!-- Not found -->
    <div v-else class="wrap notfound">
      <h1 class="t-h2">{{ locale === 'ar' ? 'المقال غير موجود' : 'Article non trouvé' }}</h1>
      <NuxtLink :to="localePath('/blog')" class="btn btn-primary" style="margin-top:1rem">
        {{ locale === 'ar' ? 'العودة إلى المدونة' : 'Retour au blog' }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.blog-post { padding-block: 2rem 4rem; }

.article-wrap { max-width: 720px; margin-inline: auto; }

.breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
.breadcrumb-link { color: var(--aqua-700); text-decoration: none; font-weight: 600; }
.breadcrumb-link:hover { text-decoration: underline; }
.breadcrumb svg { width: 16px; height: 16px; color: var(--ink-muted); }
.breadcrumb-current { color: var(--ink-muted); }

.article-header { margin-bottom: 2rem; }
.article-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 0.8rem; }
.article-title { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; }
.article-description { font-size: 1.1rem; color: var(--ink-muted); margin-top: 0.6rem; line-height: 1.5; }

.article-content { font-size: 1.05rem; line-height: 1.7; }
.article-content :deep(h2) { font-size: 1.4rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.8rem; }
.article-content :deep(h3) { font-size: 1.15rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.6rem; }
.article-content :deep(p) { margin-bottom: 1rem; }
.article-content :deep(ul), .article-content :deep(ol) { margin-bottom: 1rem; padding-inline-start: 1.5rem; }
.article-content :deep(li) { margin-bottom: 0.4rem; }
.article-content :deep(strong) { font-weight: 700; }
.article-content :deep(a) { color: var(--aqua-700); text-decoration: none; }
.article-content :deep(a:hover) { text-decoration: underline; }

.article-cta { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--line); text-align: center; }

.notfound { text-align: center; padding-block: 4rem; }
</style>
