/**
 * gym-bg.js — Centralized background slideshow for all app pages.
 * Loads a random subset of 25+ gym images each visit, always in a different order.
 */
(function () {
    'use strict';

    /* ── Image pool — gym/fitness only ────────────────────────────────────── */
    var POOL = [
        // Gym interiors & equipment
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1637666218229-0b23574f8be0?w=1920&q=85&auto=format&fit=crop',
        // Weightlifting & barbells
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=85&auto=format&fit=crop',
        // Athletes training
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1598971639058-fab3c3109a17?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576678927469-b2e70c46e2c8?w=1920&q=85&auto=format&fit=crop',
        // Machines & cables
        'https://images.unsplash.com/photo-1526401281036-25e82fc8d36a?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1541534401786-2a4f7da32c45?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507398941214-572c25a4f1f8?w=1920&q=85&auto=format&fit=crop',
        // Pull-ups & bodyweight
        'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1485727218651-d214de782a46?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=1920&q=85&auto=format&fit=crop',
        // Bench press & squats
        'https://images.unsplash.com/photo-1604652716260-08b4a6c5e4d5?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1607962837559-97f46a0ce2b0?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=1920&q=85&auto=format&fit=crop',
        // Kettlebell & functional
        'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1627483262769-04d0a1401487?w=1920&q=85&auto=format&fit=crop',
        // Extra gym shots
        'https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1920&q=85&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1920&q=85&auto=format&fit=crop',
    ];

    /* ── Fisher-Yates shuffle ───────────────────────────────────────────────── */
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    }

    /* ── Build & run slideshow ─────────────────────────────────────────────── */
    function initBg(containerId, slideClass, overlayClass, interval) {
        var container = document.getElementById(containerId);
        if (!container) return;

        /* Remove old hardcoded slides */
        var old = container.querySelectorAll('.' + slideClass);
        old.forEach(function (s) { s.remove(); });

        var overlay = container.querySelector('.' + overlayClass);
        var images  = shuffle(POOL);

        images.forEach(function (url, i) {
            var div = document.createElement('div');
            div.className = slideClass + (i === 0 ? ' active' : '');
            div.style.backgroundImage = "url('" + url + "')";
            container.insertBefore(div, overlay);
        });

        var slides = container.querySelectorAll('.' + slideClass);
        var cur    = 0;
        setInterval(function () {
            slides[cur].classList.remove('active');
            cur = (cur + 1) % slides.length;
            slides[cur].classList.add('active');
        }, interval || 24000);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initBg('dash-bg',     'dbg-slide',  'dbg-overlay',  24000);
        initBg('training-bg', 'trbg-slide', 'trbg-overlay', 20000);
    });
})();
