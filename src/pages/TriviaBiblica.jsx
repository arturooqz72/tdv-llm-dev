import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Trophy, RotateCcw } from 'lucide-react';
import GameShareButtons from '@/components/games/GameShareButtons';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';

// ⭐ FUNCIÓN PARA MEZCLAR OPCIONES
function shuffleOptions(question) {
  const opciones = [...question.opciones];
  const correcta = question.opciones[question.respuestaCorrecta];

  for (let i = opciones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
  }

  const nuevoIndex = opciones.indexOf(correcta);

  return {
    ...question,
    opciones,
    respuestaCorrecta: nuevoIndex
  };
}

// 🔥 PREGUNTAS
const preguntasTrivia = [
{
  pregunta: "¿Quién fue el hijo de Abraham y Sara?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un muro y una plomada?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Amós"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que consultó a una adivina en Endor?",
  opciones: ["David", "Salomón", "Josías", "Saúl"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su oración silenciosa en el templo?",
  opciones: ["Sara", "Rebeca", "Elisabet", "Ana"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo menor de Jacob?",
  opciones: ["Rubén", "Leví", "José", "Benjamín"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un candelabro de oro?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que escribió muchos salmos?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su fidelidad hacia su suegra?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Noé que vio la desnudez de su padre?",
  opciones: ["Sem", "Jafet", "Cam", "Nimrod"],
  respuestaCorrecta: 2
},
{
  pregunta: "¿Qué profeta vio una visión de un rollo que debía comer?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que recibió la túnica de colores?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey pidió un corazón entendido?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació primero?",
  opciones: ["Isaac", "Esaú", "Jacob", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un campo lleno de huesos secos?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que vio una estatua con cabeza de oro?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer escondió a los espías en Jericó?",
  opciones: ["Débora", "Rut", "Noemí", "Rahab"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Adán y Eva que presentó una ofrenda de ganado?",
  opciones: ["Set", "Enós", "Caín", "Abel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un hombre con un cordel de medir?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que tocaba el arpa?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su belleza en Persia?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que tuvo dos hijos en Egipto?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un carbón encendido tocando sus labios?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que escribió un salmo de arrepentimiento?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su hospitalidad hacia Eliseo?",
  opciones: ["Sara", "Rebeca", "Lea", "La sunamita"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que heredó la promesa?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un ángel tocando sus labios?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que trabajó siete años por Raquel?",
  opciones: ["Rubén", "Leví", "Benjamín", "Jacob"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey reinó después de Salomón?",
  opciones: ["Asa", "Josías", "Acab", "Roboam"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el profeta que confrontó a David por su pecado?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Natán"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por recoger espigas en el campo?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació de Agar?",
  opciones: ["Esaú", "Jacob", "Isaac", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un altar con brasas encendidas?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que soñó con un árbol grande?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su valentía al presentarse ante el rey?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que nació en su vejez?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un estanque con peces?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que pidió sabiduría?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su fe en Sarepta?",
  opciones: ["Débora", "Ana", "Rebeca", "La viuda de Sarepta"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació conforme a la promesa?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un carnero y un macho cabrío?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Daniel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que tuvo sueños proféticos?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un ejército reviviendo?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que vio la escritura en la pared?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Belsasar"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue esposa de Isaac?",
  opciones: ["Sara", "Lea", "Raquel", "Rebeca"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que soñó con el sol, la luna y las estrellas?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una visión de un trono alto y sublime?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que casi fue sacrificado?",
  opciones: ["Ismael", "Esaú", "Jacob", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer acompañó a Noemí de regreso a Judá?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que vio un sueño sobre un árbol grande que llegaba al cielo?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el padre de Abraham?",
  opciones: ["Peleg", "Serug", "Nahor", "Taré"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por reír al escuchar una promesa?",
  opciones: ["Raquel", "Ana", "Rebeca", "Sara"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Isaac y Rebeca que nació primero?",
  opciones: ["Jacob", "Esaú", "Ismael", "Esaú"],
  respuestaCorrecta: 1
},
{
  pregunta: "¿Qué profeta vio una visión de un horno humeante y una antorcha de fuego?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Abraham"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con una escalera que llegaba al cielo?",
  opciones: ["David", "Salomón", "Josías", "Jacob"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer lloró por un hijo que no tenía?",
  opciones: ["Sara", "Elisabet", "Rebeca", "Ana"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tuvo dos hijos en Egipto llamados Efraín y Manasés?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio una zarza que ardía sin consumirse?",
  opciones: ["Josué", "Samuel", "Elías", "Moisés"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey escribió el libro de Proverbios?",
  opciones: ["David", "Josías", "Ezequías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue conocida por su belleza en Persia?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién ofreció un sacrificio de animales a Dios?",
  opciones: ["Set", "Enós", "Caín", "Abel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un valle lleno de huesos secos?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con una estatua de varios metales?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer escondió a los espías?",
  opciones: ["Débora", "Rut", "Noemí", "Rahab"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo menor de Jacob?",
  opciones: ["Rubén", "Leví", "José", "Benjamín"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta comió un rollo en una visión?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tocaba el arpa para calmar a un rey?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su oración silenciosa?",
  opciones: ["Sara", "Rebeca", "Elisabet", "Ana"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació de Agar?",
  opciones: ["Esaú", "Jacob", "Isaac", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un candelabro de oro?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que recibió la túnica de colores?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey pidió sabiduría?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue conocida por su hospitalidad hacia Eliseo?",
  opciones: ["Sara", "Rebeca", "Lea", "La sunamita"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién heredó la promesa hecha a Abraham?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un ángel tocar sus labios?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién trabajó siete años por Raquel?",
  opciones: ["Rubén", "Leví", "Benjamín", "Jacob"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey reinó después de Salomón?",
  opciones: ["Asa", "Josías", "Acab", "Roboam"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién confrontó a David por su pecado?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Natán"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer recogía espigas en el campo?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació conforme a la promesa?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un altar con brasas encendidas?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con un árbol grande que llegaba al cielo?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue valiente al presentarse ante el rey?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién nació en la vejez de Jacob?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un estanque con peces?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién pidió un corazón entendido?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer mostró fe en Sarepta?",
  opciones: ["Débora", "Ana", "Rebeca", "La viuda de Sarepta"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio una visión de un carnero y un macho cabrío?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Daniel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tuvo sueños proféticos entre los hijos de Jacob?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un ejército reviviendo?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio la escritura en la pared?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Belsasar"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue esposa de Isaac?",
  opciones: ["Sara", "Lea", "Raquel", "Rebeca"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con el sol, la luna y las estrellas?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un trono alto y sublime?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién casi fue sacrificado por su padre?",
  opciones: ["Ismael", "Esaú", "Jacob", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer acompañó a Noemí?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio un árbol grande que llegaba al cielo?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació primero?",
  opciones: ["Isaac", "Esaú", "Jacob", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un rollo volando?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que recibió la túnica de colores?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey pidió sabiduría a Dios?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue conocida por su hospitalidad hacia Eliseo?",
  opciones: ["Sara", "Rebeca", "Lea", "La sunamita"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién heredó la promesa hecha a Abraham?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un ángel tocar sus labios con un carbón encendido?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién trabajó siete años por Raquel?",
  opciones: ["Rubén", "Leví", "Benjamín", "Jacob"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey reinó después de David?",
  opciones: ["Asa", "Josías", "Ezequías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién confrontó a David por su pecado?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Natán"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer recogía espigas en el campo?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació conforme a la promesa?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un altar con brasas encendidas?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con un árbol grande que llegaba al cielo?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue valiente al presentarse ante el rey?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién nació en la vejez de Jacob?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un estanque con peces?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién pidió sabiduría para gobernar?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer mostró fe en Sarepta?",
  opciones: ["Débora", "Ana", "Rebeca", "La viuda de Sarepta"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio una visión de un carnero y un macho cabrío?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Daniel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tuvo sueños proféticos entre los hijos de Jacob?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un ejército reviviendo?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio la escritura en la pared?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Belsasar"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue esposa de Isaac?",
  opciones: ["Sara", "Lea", "Raquel", "Rebeca"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con el sol, la luna y las estrellas?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un trono alto y sublime?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién casi fue sacrificado por su padre?",
  opciones: ["Ismael", "Esaú", "Jacob", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer acompañó a Noemí?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio un árbol grande que llegaba al cielo?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el padre de Moisés?",
  opciones: ["Natán", "Elcana", "Taré", "Amram"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer cuidó al bebé Moisés en una cesta?",
  opciones: ["Sara", "Lea", "Raquel", "La hija de Faraón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hermano menor de Moisés?",
  opciones: ["Natán", "Samuel", "Josué", "Aarón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un trono alto y sublime?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién pidió un corazón entendido para gobernar?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer se rió al escuchar una promesa?",
  opciones: ["Rebeca", "Raquel", "Ana", "Sara"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con el sol, la luna y once estrellas?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un carbón encendido tocar sus labios?",
  opciones: ["Jeremías", "Ezequiel", "Daniel", "Isaías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tocaba el arpa para calmar a un rey?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su fidelidad hacia su suegra?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Adán y Eva que ofreció un sacrificio de animales?",
  opciones: ["Set", "Enós", "Caín", "Abel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un hombre con un cordel de medir?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el rey que tocaba el arpa?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su belleza en Persia?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Jacob que tuvo dos hijos en Egipto?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una zarza que ardía sin consumirse?",
  opciones: ["Josué", "Samuel", "Elías", "Moisés"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién escribió muchos proverbios?",
  opciones: ["David", "Josías", "Ezequías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer oró en silencio?",
  opciones: ["Sara", "Rebeca", "Elisabet", "Ana"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham que nació de Agar?",
  opciones: ["Esaú", "Jacob", "Isaac", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo de Abraham y Sara?",
  opciones: ["Esaú", "Jacob", "Ismael", "Isaac"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un muro y una plomada?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Amós"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién consultó a una adivina en Endor?",
  opciones: ["David", "Salomón", "Josías", "Saúl"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer oró en silencio en el templo?",
  opciones: ["Sara", "Rebeca", "Elisabet", "Ana"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién fue el hijo menor de Jacob?",
  opciones: ["Rubén", "Leví", "José", "Benjamín"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un candelabro de oro?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién escribió muchos salmos?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer mostró fidelidad hacia su suegra?",
  opciones: ["Sara", "Ana", "Rebeca", "Rut"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio la desnudez de su padre Noé?",
  opciones: ["Sem", "Jafet", "Cam", "Nimrod"],
  respuestaCorrecta: 2
},
{
  pregunta: "¿Qué profeta comió un rollo en una visión?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién recibió la túnica de colores?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué rey pidió un corazón entendido?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién nació primero, hijo de Abraham?",
  opciones: ["Isaac", "Esaú", "Jacob", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un valle de huesos secos?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con una estatua de varios metales?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer escondió a los espías?",
  opciones: ["Débora", "Rut", "Noemí", "Rahab"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién ofreció un sacrificio de animales?",
  opciones: ["Set", "Enós", "Caín", "Abel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un hombre con un cordel de medir?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Zacarías"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tocaba el arpa para un rey?",
  opciones: ["Salomón", "Josías", "Ezequías", "David"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue conocida por su belleza en Persia?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tuvo dos hijos en Egipto?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio una zarza ardiendo?",
  opciones: ["Josué", "Samuel", "Elías", "Moisés"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién escribió Proverbios?",
  opciones: ["David", "Josías", "Ezequías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer oró en silencio?",
  opciones: ["Sara", "Rebeca", "Elisabet", "Ana"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién nació de Agar?",
  opciones: ["Esaú", "Jacob", "Isaac", "Ismael"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un altar con brasas?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién soñó con un árbol grande?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Nabucodonosor"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer fue valiente ante el rey?",
  opciones: ["Débora", "Rut", "Noemí", "Ester"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién nació en la vejez de Jacob?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un estanque con peces?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién pidió sabiduría?",
  opciones: ["Saúl", "David", "Josías", "Salomón"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué mujer mostró fe en Sarepta?",
  opciones: ["Débora", "Ana", "Rebeca", "La viuda de Sarepta"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio un carnero y un macho cabrío?",
  opciones: ["Isaías", "Jeremías", "Ezequiel", "Daniel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién tuvo sueños proféticos?",
  opciones: ["Rubén", "Leví", "Benjamín", "José"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Qué profeta vio un ejército reviviendo?",
  opciones: ["Isaías", "Jeremías", "Daniel", "Ezequiel"],
  respuestaCorrecta: 3
},
{
  pregunta: "¿Quién vio la escritura en la pared?",
  opciones: ["Ciro", "Darío", "Artajerjes", "Belsasar"],
  respuestaCorrecta: 3
}
];

export default function TriviaBiblica() {
  const [currentUser, setCurrentUser] = useState(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [preguntaMezclada, setPreguntaMezclada] = useState(null);
  const [puntuacion, setPuntuacion] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [concursoActivo, setConcursoActivo] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadEstado = async () => {
      try {
        const estado = await base44.entities.TriviaEstado.get('estado');
        if (estado) setConcursoActivo(estado.activo);
      } catch (error) {
        console.log("No se pudo cargar el estado del concurso");
      }
    };
    loadEstado();
  }, []);

  useEffect(() => {
    setPreguntaMezclada(shuffleOptions(preguntasTrivia[preguntaActual]));
  }, [preguntaActual]);

  if (!preguntaMezclada) return null;

  const manejarRespuesta = (indice) => {
    setRespuestaSeleccionada(indice);
    setMostrarResultado(true);

    const esCorrecta = indice === preguntaMezclada.respuestaCorrecta;

    if (esCorrecta) {
      setPuntuacion(puntuacion + 1);
    } else {
      setPuntuacion(Math.max(0, puntuacion - 1));
    }

    setTimeout(async () => {
      if (preguntaActual < preguntasTrivia.length - 1) {
        setPreguntaActual(preguntaActual + 1);
        setRespuestaSeleccionada(null);
        setMostrarResultado(false);
      } else {
        setJuegoTerminado(true);

        if (currentUser) {
          try {
            const entidad = concursoActivo
              ? base44.entities.RankingTriviaConcurso
              : base44.entities.RankingTriviaPractica;

            await entidad.create({
              userId: currentUser.id,
              nombre: currentUser.full_name || currentUser.email,
              puntos: puntuacion,
              fecha: new Date().toISOString()
            });
          } catch (error) {
            console.error('Error guardando puntuación:', error);
          }
        }

        if (esCorrecta && puntuacion + 1 >= preguntasTrivia.length * 0.7) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    }, 2000);
  };

  const reiniciarJuego = () => {
    setPreguntaActual(0);
    setPuntuacion(0);
    setRespuestaSeleccionada(null);
    setMostrarResultado(false);
    setJuegoTerminado(false);
  };

  if (juegoTerminado) {
    const porcentaje = (puntuacion / preguntasTrivia.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-blue-100 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-white border border-sky-200 shadow-xl rounded-3xl p-8 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Juego Terminado!</h2>

            <p className="text-2xl text-sky-600 font-bold mb-2">
              Puntuación: {puntuacion} de {preguntasTrivia.length}
            </p>

            <p className="text-xl text-gray-600 mb-6">
              {porcentaje >= 70
                ? "¡Excelente conocimiento bíblico!"
                : porcentaje >= 50
                ? "¡Bien hecho! Sigue estudiando"
                : "¡Sigue aprendiendo!"}
            </p>

            <Button
              onClick={reiniciarJuego}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-2xl"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Jugar de Nuevo
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-blue-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">

        <div className="text-center mb-8">
          <Link to={createPageUrl("Explore")}>
            <Button className="mb-4 bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-lg rounded-2xl">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-emerald-600">
              Trivia Bíblica
            </h1>
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>

          <p className="text-gray-600">Pon a prueba tu conocimiento de la Biblia</p>
          <GameShareButtons page="TriviaBiblica" title="Trivia Bíblica" />
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-700 font-semibold">
            Pregunta {preguntaActual + 1} de {preguntasTrivia.length}
          </span>
          <span className="text-sky-600 font-semibold">
            Puntuación: {puntuacion}
          </span>
        </div>

        <Card className="bg-white border border-sky-200 shadow-xl rounded-3xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {preguntaMezclada.pregunta}
          </h2>

          <div className="space-y-4">
            {preguntaMezclada.opciones.map((opcion, indice) => (
              <button
                key={indice}
                onClick={() => !mostrarResultado && manejarRespuesta(indice)}
                disabled={mostrarResultado}
                className={`w-full p-4 rounded-2xl text-left font-semibold transition-all border ${
                  mostrarResultado
                    ? indice === respuestaSeleccionada
                      ? respuestaSeleccionada === preguntaMezclada.respuestaCorrecta
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-red-500 border-red-500 text-white"
                      : indice === preguntaMezclada.respuestaCorrecta
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-gray-500"
                    : "bg-sky-50 border-sky-200 text-gray-800 hover:bg-sky-100"
                }`}
              >
                {opcion}
              </button>
            ))}
          </div>
        </Card>

        <div className="w-full bg-sky-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((preguntaActual + 1) / preguntasTrivia.length) * 100}%` }}
          />
        </div>

      </div>
    </div>
  );
}
