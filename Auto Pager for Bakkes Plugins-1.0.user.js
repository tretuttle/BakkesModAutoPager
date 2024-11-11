// ==UserScript==
// @name         Auto Pager for Bakkes Plugins
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically load the next page on bakkesplugins.com without duplicating content
// @match        https://bakkesplugins.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let currentPage = 1;
    let loading = false;
    const maxRetries = 3;

    // Function to load the next page with retry and exponential backoff
    function loadNextPage(retries = maxRetries, delay = 1000) {
        if (loading) return;
        loading = true;
        currentPage += 1;

        // Construct the URL for the next page
        const nextPageUrl = `https://bakkesplugins.com/plugin-search/${currentPage}`;

        fetch(nextPageUrl, { cache: 'no-store' })
            .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
            .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const newContent = doc.querySelector('.content-container');

            // Check if new content is valid and different from what we already have
            if (newContent && newContent.innerHTML.trim() !== document.querySelector('.content-container').innerHTML.trim()) {
                document.querySelector('.content-container').appendChild(newContent);
            } else {
                console.log("No new content found, stopping further loading.");
                window.removeEventListener('scroll', handleScroll); // Stop loading more pages if no new content
            }
            loading = false;
        })
            .catch(error => {
            console.error(`Failed to load page ${currentPage}:`, error);
            if (retries > 0) {
                console.log(`Retrying in ${delay} ms... (${retries} retries left)`);
                setTimeout(() => loadNextPage(retries - 1, delay * 2), delay); // Exponential backoff
            } else {
                console.error('Max retries reached. Stopping further attempts.');
                loading = false;
            }
        });
    }

    // Scroll event listener to trigger loading when near the bottom
    function handleScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadNextPage();
        }
    }

    window.addEventListener('scroll', handleScroll);
})();
