# Бесконечный скролл

## Вводные данные

1) Окно фиксированного размера (это важно). В  нём рендерится виртуальный список.

2) Высота одно элемента. Нужна для подсчёта размера чанка (количества элементов в чанке)

3) Чанк. Содержит количество элементов (2), способное полностью заполнить ОКНО (1). РАЗМЕРЫ ЧАНКА - означают количество его элементов внутри него. ВЫСОТА ЧАНКА - вычисляется по формуле РАЗМЕРЫ ЧАНКА * ВЫСОТА 1 ЭЛЕМЕНТА

4) Направление скролла. Влияет на подсчёт для рендера следующего (или предыдущего) чанка.

5) Индекс рендера. За ним нужно следить, чтобы понимать, какие элементы надо рендерить следующими.

6) СкроллДетектор. Следить за размером скролла и высчитывает индекс следующих элементов для рендера.



## Рендеринг списка

Для того чтобы обеспечить плавную подгрузку нужных элементов, мы должны держать в ДОМе четыре (4) чанка.

###### В каждый момент времени мы видим 2 чанка (иногда 1, но это редкость)

### При движении вниз  (scroll down)
Следующий чанк рендерится, с учётом того чтообы в запасе был минимум ещё 1 чанк. Можно читать иначе - рендерим следующий чанк, если количество элементов в списке снизу МЕНЬШЕ ИЛИ РАВНО размеру чанка.

Пример:
- размер чанка 7 элементов
- СкроллДетектор говорит что мы на 37 элементе (7 * 5 = 35). Т.е. мы в шестом чанке на 2м элементе (35 + 2).
- Если в запасе должен быть минимум 1 чанк, то наш список сейчас имеет 7 чанков (точнее 7й чанк последний, мы его не видим). 7 * 7 = 49. Последний индекс в списке - 49. 
- Значит 8й чанк будет рендерится, когда мы коснёмся НАЧАЛА 7го чанка, т.е. (6*7 + 1 = 43) 43го элемента.
- Если текущий индекс рендера - 43, то конечный высчитывается по формуле. ТЕКУЩИЙ ИНДЕКС + 2 * РАЗМЕР ЧАНКА.  
- На самом деле правильно так: ((индекс первого элемента в текущем чанке) - 1) + 2 * РАЗМЕР ЧАНКА. 
Т.е. (43 - 1) + 2 * 7 = 42 + 14 = 56. Это и есть КОНЕЧНЫЙ ИНДЕКС будушего рендера, в момент, когда мы коснулись последнего чанка. Это и будет 8й чанк.