<template>
    <div class="max-w-7xl mx-auto ">
        <h1 class="hidden sm:block sm:text-4xl md:text-5xl font-semibold justify-center mx-auto text-center mb-10 md:mb-0 ">Comment ça marche ?</h1>
        <div class="flex flex-col sm:flex-row items-center justify-center sm:-space-x-40">
            <img :src="question" alt="" srcset="" class="w-1/2 lg:w-1/3 md:p-10  z-30" />
            <div class="w-full sm:w-2/3 lg:w-1/2 flex justify-center  md:justify-start p-5 sm:px-10 md:p-5  sm:-mb-60 md:-mb-80">
                <div class="p-4 md:p-6 shadow bg-card-right bg-cover">
                    <h3 class="text-2xl font-semibold flex justify-start sm:justify-end  mb-5">
                        vous êtes propriétaire ?
                    </h3>
                    <ul class="flex flex-col sm:flex-row-reverse space-y-4 sm:space-y-10">
                        <li class="sm:w-1/3"> 
                            <p class="text-lg font-semibold">
                            🔐 S'authentifier
                            </p> 
                            <p class="text-xs">
                                Créez votre profile annonceur en toute simplicité ! c'est là ou vous allez gérer vos annonces et vos informations personnelles.
                            </p>
                        </li>
                        <li  class="sm:w-1/3 sm:pt-10">
                            <p class="text-lg font-semibold">
                            📢 Publier
                            </p> 
                            <p class="text-xs">
                               Publiez le formulaire de création d'annonces après avoir rempli tous les champs nécessaires, sachez que votre annonce ne sera pas visible si vous ne lui ajoutez pas de belles images !
                            </p>
                           
                        </li>
                        <li class="sm:w-1/3 sm:pt-36 z-20">
                            <p class="text-lg font-semibold">
                             🤝🏻 Accueillir
                            </p> 
                            <p class="text-xs">
                                Recevez les appels de vos futurs invités et expliquez leur tous ce qu'il faut qu'ils sachent dans le respect, la joie et la générosité.
                            </p>
                        </li>
                    </ul>                   
                </div>
            </div>
        </div>
 
        <div class="flex flex-col sm:flex-row  items-center  justify-center sm:-space-x-40">
            <div class="w-full sm:w-2/3 lg:w-1/2 flex justify-center md:justify-end  p-5 sm:px-10 md:p-5 sm:mt-44 md:mt-64">
                <div class="p-4 md:p-6 shadow  bg-card-left bg-cover">
                    <h3 class="text-2xl font-semibold mb-5">
                        Vous êtes locataire ?
                    </h3>
                    <ul class="flex flex-col sm:flex-row space-y-4 sm:space-y-10">
                        <li class="sm:w-1/3"> 
                            <p class="text-lg font-semibold">
                            👀 A vos marques
                            </p> 
                            <p class="text-xs">
                                Cherchez la piscine la plus proche de chez vous parmis notre large choix de piscines partout au Maroc !
                            </p>
                        </li>
                        <li  class="sm:w-1/3 sm:pt-4">
                            <p class="text-lg font-semibold">
                            🎯 Pret
                            </p> 
                            <p class="text-xs">
                               Après avoir trouver la piscine qui vous convient, contactez le proprietaire pour fixer une date et vous mettre d'accord sur tout les details.
                            </p>
                           
                        </li>
                        <li class="sm:w-1/3 sm:pt-28 z-20">
                            <p class="text-lg font-semibold">
                             💃🏻 Partez
                            </p> 
                            <p class="text-xs">
                                Profitez a fond de votre petit coin de paradis ! <br/>Au cas où vous changer d'avis, veuillez 🙏 informer le locataire le plutôt possible.
                            </p>
                        </li>
                    </ul>
                </div>
            </div>
            <img class="w-2/3 sm:w-1/2 lg:w-1/3 p-10" :src="happy" alt="" srcset="" />
        </div>
    </div>
    <div id="absolute bottom-0 h-full background-wrap overflow-hidden w-screen">    
        <div class="bubble  x1"></div>
        <div class="bubble  x2"></div>
        <div class="bubble  x3"></div>
        <div class="bubble  x4"></div>
        <div class="bubble  x5"></div>
        <div class="bubble  x6"></div>
        <div class="bubble  x7"></div>
        <div class="bubble  x8"></div>
        <div class="bubble  x9"></div>
        <div class="bubble  x10"></div>
    </div>
</template>

<script>
import question from '@/assets/img/illustrations/Questions-amico.svg'
import happy from '@/assets/img/illustrations/Enthusiastic-amico.svg'
import bg_card_right from '@/assets/img/bg_card_right.png'
import bg_card_left from '@/assets/img/bg_card_left.png'
export default {
    setup() {
        return {
            happy,
            question,
            bg_card_right,
            bg_card_left,
        }
    },
}
</script>

<style>
body {
	margin: 0;
	padding: 0;
	overflow-x: hidden;
}
#background-wrap {
    bottom: 0;
	left: 0;
	position: fixed;
	right: 0;
	top: 0;
	z-index: -1;
}

/* KEYFRAMES */

@-webkit-keyframes animateBubble {
    0% {
        margin-top: 1000px;
    }
    100% {
        margin-top: -100%;
    }
}

@-moz-keyframes animateBubble {
    0% {
        margin-top: 1000px;
    }
    100% {
        margin-top: -100%;
    }
}

@keyframes animateBubble {
    0% {
        margin-top: 1000px;
    }
    100% {
        margin-top: -100%;
    }
}

@-webkit-keyframes sideWays { 
    0% { 
        margin-left:0px;
    }
    100% { 
        margin-left:50px;
    }
}

@-moz-keyframes sideWays { 
    0% { 
        margin-left:0px;
    }
    100% { 
        margin-left:50px;
    }
}

@keyframes sideWays { 
    0% { 
        margin-left:0px;
    }
    100% { 
        margin-left:50px;
    }
}

/* ANIMATIONS */

.x1 {
    -webkit-animation: animateBubble 25s linear infinite, sideWays 2s ease-in-out infinite alternate;
	-moz-animation: animateBubble 25s linear infinite, sideWays 2s ease-in-out infinite alternate;
	animation: animateBubble 25s linear infinite, sideWays 2s ease-in-out infinite alternate;
	
	left: -5%;
	top: 5%;
	
	-webkit-transform: scale(0.6);
	-moz-transform: scale(0.6);
	transform: scale(0.6);
}

.x2 {
    -webkit-animation: animateBubble 20s linear infinite, sideWays 4s ease-in-out infinite alternate;
	-moz-animation: animateBubble 20s linear infinite, sideWays 4s ease-in-out infinite alternate;
	animation: animateBubble 20s linear infinite, sideWays 4s ease-in-out infinite alternate;
	
	left: 5%;
	top: 80%;
	
	-webkit-transform: scale(0.4);
	-moz-transform: scale(0.4);
	transform: scale(0.4);
}

.x3 {
    -webkit-animation: animateBubble 28s linear infinite, sideWays 2s ease-in-out infinite alternate;
	-moz-animation: animateBubble 28s linear infinite, sideWays 2s ease-in-out infinite alternate;
	animation: animateBubble 28s linear infinite, sideWays 2s ease-in-out infinite alternate;
	
	left: 10%;
	top: 40%;
	
	-webkit-transform: scale(0.2);
	-moz-transform: scale(0.2);
	transform: scale(0.2);
}

.x4 {
    -webkit-animation: animateBubble 22s linear infinite, sideWays 3s ease-in-out infinite alternate;
	-moz-animation: animateBubble 22s linear infinite, sideWays 3s ease-in-out infinite alternate;
	animation: animateBubble 22s linear infinite, sideWays 3s ease-in-out infinite alternate;
	
	left: 20%;
	top: 0;
	
	-webkit-transform: scale(0.3);
	-moz-transform: scale(0.3);
	transform: scale(0.3);
}

.x5 {
    -webkit-animation: animateBubble 29s linear infinite, sideWays 4s ease-in-out infinite alternate;
	-moz-animation: animateBubble 29s linear infinite, sideWays 4s ease-in-out infinite alternate;
	animation: animateBubble 29s linear infinite, sideWays 4s ease-in-out infinite alternate;
	
	left: 30%;
	top: 50%;
	
	-webkit-transform: scale(0.5);
	-moz-transform: scale(0.5);
	transform: scale(0.5);
}

.x6 {
    -webkit-animation: animateBubble 21s linear infinite, sideWays 2s ease-in-out infinite alternate;
	-moz-animation: animateBubble 21s linear infinite, sideWays 2s ease-in-out infinite alternate;
	animation: animateBubble 21s linear infinite, sideWays 2s ease-in-out infinite alternate;
	
	left: 50%;
	top: 0;
	
	-webkit-transform: scale(0.3);
	-moz-transform: scale(0.3);
	transform: scale(0.3);
}

.x7 {
    -webkit-animation: animateBubble 20s linear infinite, sideWays 2s ease-in-out infinite alternate;
	-moz-animation: animateBubble 20s linear infinite, sideWays 2s ease-in-out infinite alternate;
	animation: animateBubble 20s linear infinite, sideWays 2s ease-in-out infinite alternate;
	
	left: 65%;
	top: 70%;
	
	-webkit-transform: scale(0.4);
	-moz-transform: scale(0.4);
	transform: scale(0.4);
}

.x8 {
    -webkit-animation: animateBubble 22s linear infinite, sideWays 3s ease-in-out infinite alternate;
	-moz-animation: animateBubble 22s linear infinite, sideWays 3s ease-in-out infinite alternate;
	animation: animateBubble 22s linear infinite, sideWays 3s ease-in-out infinite alternate;
	
	left: 80%;
	top: 10%;
	
	-webkit-transform: scale(0.3);
	-moz-transform: scale(0.3);
	transform: scale(0.3);
}

.x9 {
    -webkit-animation: animateBubble 29s linear infinite, sideWays 4s ease-in-out infinite alternate;
	-moz-animation: animateBubble 29s linear infinite, sideWays 4s ease-in-out infinite alternate;
	animation: animateBubble 29s linear infinite, sideWays 4s ease-in-out infinite alternate;
	
	left: 90%;
	top: 50%;
	
	-webkit-transform: scale(0.6);
	-moz-transform: scale(0.6);
	transform: scale(0.6);
}

.x10 {
    -webkit-animation: animateBubble 26s linear infinite, sideWays 2s ease-in-out infinite alternate;
	-moz-animation: animateBubble 26s linear infinite, sideWays 2s ease-in-out infinite alternate;
	animation: animateBubble 26s linear infinite, sideWays 2s ease-in-out infinite alternate;
	
	left: 80%;
	top: 80%;
	
	-webkit-transform: scale(0.3);
	-moz-transform: scale(0.3);
	transform: scale(0.3);
}

/* OBJECTS */

.bubble {
    -webkit-border-radius: 50%;
	-moz-border-radius: 50%;
	border-radius: 50%;
	
    -webkit-box-shadow: 0 20px 30px rgba(208, 251, 255, 0.2), inset 0px 10px 30px 5px rgba(208, 251, 255, 1);
	-moz-box-shadow: 0 20px 30px rgba(208, 251, 255, 0.2), inset 0px 10px 30px 5px rgba(208, 251, 255, 1);
	box-shadow: 0 20px 30px rgba(208, 251, 255, 0.2), inset 0px 10px 30px 5px rgba(208, 251, 255, 1);
	
    height: 200px;
	position: absolute;
	width: 200px;
}

.bubble:after {
    background: -moz-radial-gradient(center, ellipse cover,  rgba(255,242,255,0.5) 0%, rgba(4,232,255,0) 70%); /* FF3.6+ */
    background: -webkit-gradient(radial, center center, 0px, center center, 100%, color-stop(0%,rgba(255,242,255,0.5)), color-stop(70%,rgba(4,232,255,0))); /* Chrome,Safari4+ */
    background: -webkit-radial-gradient(center, ellipse cover,  rgba(255,242,255,0.5) 0%,rgba(4,232,255,0) 70%); /* Chrome10+,Safari5.1+ */
    background: -o-radial-gradient(center, ellipse cover,  rgba(255,242,255,0.5) 0%,rgba(4,232,255,0) 70%); /* Opera 12+ */
    background: -ms-radial-gradient(center, ellipse cover,  rgba(255,242,255,0.5) 0%,rgba(4,232,255,0) 70%); /* IE10+ */
    background: radial-gradient(ellipse at center,  rgba(255,242,255,0.5) 0%,rgba(4,232,255,0) 70%); /* W3C */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#806AF2FF', endColorstr='#006AF2FF',GradientType=1 ); /* IE6-9 fallback on horizontal gradient */

	-webkit-border-radius: 50%;
	-moz-border-radius: 50%;
	border-radius: 50%;
	
    -webkit-box-shadow: inset 0 20px 30px rgba(232, 251, 255, 1);
	-moz-box-shadow: inset 0 20px 30px rgba(232, 251, 255, 1);
	box-shadow: inset 0 20px 30px rgba(232, 251, 255, 1);
	
	content: "";
    height: 180px;
	left: 10px;
	position: absolute;
	width: 180px;
}
</style>
