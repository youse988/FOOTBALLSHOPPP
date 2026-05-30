// USMA d'Alger Landing Page - Client Logic
// Coordinates Carousel, Interactive T-shirt Viewer, Dynamic Address Sync, and Validation

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. POPULATE WILAYAS & COMMUNES (58 WILAYAS DATA) ---
    // Select elements from both forms (main checkout form & sticky bottom bar form)
    const mainForm = document.getElementById('mainCheckoutForm');
    const mainFullname = document.getElementById('fullname');
    const mainPhone = document.getElementById('phone');
    const mainWilayaSelect = document.getElementById('wilayaSelect');
    const mainCommuneSelect = document.getElementById('communeSelect');

    const stickyForm = document.getElementById('stickyCheckoutForm');
    const stickyFullname = document.getElementById('stickyFullname');
    const stickyPhone = document.getElementById('stickyPhone');
    const stickyWilayaSelect = document.getElementById('stickyWilayaSelect');
    const stickyCommuneSelect = document.getElementById('stickyCommuneSelect');

    function getWilayaLabel(w) {
        return getLang() === 'ar'
            ? `${w.code} - ${w.name_ar}`
            : `${w.code} - ${w.name}`;
    }

    function getCommuneLabel(c) {
        return getLang() === 'ar' ? c.name_ar : c.name;
    }

    function populateWilayas() {
        const savedMain = mainWilayaSelect.value;
        const savedSticky = stickyWilayaSelect.value;

        mainWilayaSelect.innerHTML = '';
        stickyWilayaSelect.innerHTML = '';

        const placeholderMain = new Option(t('chooseWilaya'), '', true, true);
        placeholderMain.disabled = true;
        mainWilayaSelect.add(placeholderMain);

        const placeholderSticky = new Option(t('stickyWilaya'), '', true, true);
        placeholderSticky.disabled = true;
        stickyWilayaSelect.add(placeholderSticky);

        if (typeof ALGERIA_DATA !== 'undefined' && Array.isArray(ALGERIA_DATA)) {
            ALGERIA_DATA.forEach(w => {
                mainWilayaSelect.add(new Option(getWilayaLabel(w), w.code));
                stickyWilayaSelect.add(new Option(getWilayaLabel(w), w.code));
            });
        } else {
            console.error('Algerian wilayas and communes data not found!');
        }

        if (savedMain) mainWilayaSelect.value = savedMain;
        if (savedSticky) stickyWilayaSelect.value = savedSticky;
    }

    function populateCommunes(wilayaCode, selectElement) {
        const isMain = selectElement === mainCommuneSelect;
        const savedValue = selectElement.value;

        selectElement.innerHTML = '';
        const placeholderText = isMain ? t('chooseCommune') : t('communeShort');
        selectElement.add(new Option(placeholderText, '', true, true));
        selectElement.options[0].disabled = true;

        if (!wilayaCode) {
            selectElement.disabled = true;
            return;
        }

        const wilaya = ALGERIA_DATA.find(w => w.code === wilayaCode);
        if (wilaya && wilaya.communes) {
            wilaya.communes.forEach(c => {
                selectElement.add(new Option(getCommuneLabel(c), c.name));
            });
            selectElement.disabled = false;
            if (savedValue) selectElement.value = savedValue;
        }
    }

    populateWilayas();

    // Synchronize inputs between main form and sticky bottom form
    function syncInputs(source, target) {
        target.value = source.value;
    }

    // --- PRICING & ORDER SUMMARY ---
    const qtyS = document.getElementById('qtyS');
    const qtyM = document.getElementById('qtyM');
    const qtyL = document.getElementById('qtyL');
    const qtyXL = document.getElementById('qtyXL');
    const sizeSummary = document.getElementById('sizeSummary');
    const deliveryHomePrice = document.getElementById('deliveryHomePrice');
    const deliveryStopDeskPrice = document.getElementById('deliveryStopDeskPrice');
    const stopDeskOptionLabel = document.getElementById('stopDeskOptionLabel');
    const deliveryMethodInputs = document.querySelectorAll('#group-delivery input[type="radio"]');
    const summaryShirtCount = document.getElementById('summaryShirtCount');
    const summaryShirtPrice = document.getElementById('summaryShirtPrice');
    const summaryDeliveryPrice = document.getElementById('summaryDeliveryPrice');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');
    const stickyBarPrice = document.getElementById('stickyBarPrice');
    const successOrderDetails = document.getElementById('successOrderDetails');
    const sizeInputs = [qtyS, qtyM, qtyL, qtyXL];

    function formatPrice(amount) {
        const locale = getLang() === 'ar' ? 'ar-DZ' : 'fr-DZ';
        const suffix = getLang() === 'ar' ? ' دج' : ' DA';
        return `${amount.toLocaleString(locale)}${suffix}`;
    }

    // Pricing rules:
    // Base price per shirt = 3000 DA.
    // When buying 2 or more shirts, each shirt gets a 100 DA discount (i.e., 2900 DA per shirt).
    function getShirtBundlePrice(count) {
        if (count <= 0) return 0;
        if (count === 1) return 3000;
        // 2 or more shirts: discounted unit price
        return count * 2900;
    }
    function getTotalShirtQty() {
        return sizeInputs.reduce((sum, input) => sum + (parseInt(input.value, 10) || 0), 0);
    }

    // Duplicate placeholder removed

    function getSelectedWilayaCode() {
        return mainWilayaSelect.value || stickyWilayaSelect.value;
    }

    function getDeliveryRates(wilayaCode) {
        if (!wilayaCode || typeof DELIVERY_RATES === 'undefined') return null;
        return DELIVERY_RATES[wilayaCode] || null;
    }

    function getSelectedDeliveryMethod() {
        const selected = document.querySelector('#group-delivery input[type="radio"]:checked');
        return selected ? selected.value : 'home';
    }

    function getDeliveryFee(wilayaCode, method) {
        const rates = getDeliveryRates(wilayaCode);
        if (!rates) return 0;
        if (method === 'stopdesk') {
            return rates.stopDesk != null ? rates.stopDesk : rates.home;
        }
        return rates.home;
    }

    function getSizeBreakdown() {
        const sizes = [
            { label: 'S', qty: parseInt(qtyS.value, 10) || 0 },
            { label: 'M', qty: parseInt(qtyM.value, 10) || 0 },
            { label: 'L', qty: parseInt(qtyL.value, 10) || 0 },
            { label: 'XL', qty: parseInt(qtyXL.value, 10) || 0 }
        ];
        return sizes.filter(s => s.qty > 0);
    }

    function updateDeliveryPrices() {
        const wilayaCode = getSelectedWilayaCode();
        const rates = getDeliveryRates(wilayaCode);

        const dash = getLang() === 'ar' ? '— دج' : '— DA';
        if (!rates) {
            deliveryHomePrice.textContent = dash;
            deliveryStopDeskPrice.textContent = dash;
            stopDeskOptionLabel.classList.remove('disabled');
            return;
        }

        deliveryHomePrice.textContent = formatPrice(rates.home);

        if (rates.stopDesk == null) {
            deliveryStopDeskPrice.textContent = t('notAvailable');
            stopDeskOptionLabel.classList.add('disabled');
            const stopDeskRadio = stopDeskOptionLabel.querySelector('input[value="stopdesk"]');
            if (stopDeskRadio && stopDeskRadio.checked) {
                document.querySelector('#group-delivery input[value="home"]').checked = true;
            }
        } else {
            deliveryStopDeskPrice.textContent = formatPrice(rates.stopDesk);
            stopDeskOptionLabel.classList.remove('disabled');
        }
    }

    function updateOrderSummary() {
        const totalQty = getTotalShirtQty();
        const wilayaCode = getSelectedWilayaCode();
        const method = getSelectedDeliveryMethod();
        const shirtPrice = getShirtBundlePrice(totalQty);
        const deliveryFee = totalQty > 0 ? getDeliveryFee(wilayaCode, method) : 0;
        const total = shirtPrice + deliveryFee;

        const breakdown = getSizeBreakdown();
        if (breakdown.length === 0) {
            sizeSummary.textContent = t('sizeSummaryNone');
        } else {
            const parts = breakdown.map(s => `${s.qty}× ${s.label}`);
            const key = totalQty > 1 ? 'sizeSummaryMany' : 'sizeSummaryOne';
            sizeSummary.textContent = t(key, { count: totalQty, details: parts.join(', ') });
        }

        summaryShirtCount.textContent = totalQty;
        summaryShirtPrice.textContent = formatPrice(shirtPrice);
        summaryDeliveryPrice.textContent = totalQty > 0 && wilayaCode ? formatPrice(deliveryFee) : '—';
        summaryTotalPrice.textContent = formatPrice(total);

        if (stickyBarPrice) {
            // Compute old price (base price without discount) for strike‑through
            const oldUnit = 3000;
            const oldTotal = totalQty * oldUnit;
            let oldPriceFormatted;
            if (getLang() === 'ar') {
                // Keep western digits for the crossed‑out old price
                oldPriceFormatted = `${oldTotal.toLocaleString('en-US')} دج`;
            } else {
                oldPriceFormatted = formatPrice(oldTotal);
            }
            const defaultPrice = getLang() === 'ar' ? '3000 دج' : '3 000 DA';
            const strike = `<span style="text-decoration: line-through; font-size: 11px; opacity: 0.6; color: var(--text-muted); font-weight: normal;">${oldPriceFormatted}</span>`;
            stickyBarPrice.innerHTML = total > 0
                ? `${formatPrice(total)} ${strike}`
                : `${defaultPrice} ${strike}`;
        }

        updateDeliveryPrices();
    }

    document.addEventListener('languageChanged', () => {
        const wilayaCode = getSelectedWilayaCode();
        populateWilayas();
        if (wilayaCode) {
            mainWilayaSelect.value = wilayaCode;
            stickyWilayaSelect.value = wilayaCode;
            populateCommunes(wilayaCode, mainCommuneSelect);
            populateCommunes(wilayaCode, stickyCommuneSelect);
        }
        updateOrderSummary();
    });

    sizeInputs.forEach(input => {
        input.addEventListener('input', () => {
            const val = parseInt(input.value, 10);
            if (val < 0) input.value = 0;
            clearValidation(document.getElementById('group-sizes'));
            updateOrderSummary();
        });
    });
// Quantity control button handlers
document.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        let val = parseInt(input.value, 10) || 0;
        if (val > 0) input.value = val - 1;
        clearValidation(document.getElementById('group-sizes'));
        updateOrderSummary();
    });
});

document.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        let val = parseInt(input.value, 10) || 0;
        if (val < 99) input.value = val + 1;
        clearValidation(document.getElementById('group-sizes'));
        updateOrderSummary();
    });
});
    deliveryMethodInputs.forEach(input => {
        input.addEventListener('change', () => {
            clearValidation(document.getElementById('group-delivery'));
            updateOrderSummary();
        });
    });

    // Wilaya change handlers
    mainWilayaSelect.addEventListener('change', () => {
        stickyWilayaSelect.value = mainWilayaSelect.value;
        populateCommunes(mainWilayaSelect.value, mainCommuneSelect);
        populateCommunes(stickyWilayaSelect.value, stickyCommuneSelect);
        clearValidation(document.getElementById('group-wilaya'));
        clearValidation(document.getElementById('sticky-group-wilaya'));
        updateOrderSummary();
    });

    stickyWilayaSelect.addEventListener('change', () => {
        mainWilayaSelect.value = stickyWilayaSelect.value;
        populateCommunes(stickyWilayaSelect.value, stickyCommuneSelect);
        populateCommunes(mainWilayaSelect.value, mainCommuneSelect);
        clearValidation(document.getElementById('group-wilaya'));
        clearValidation(document.getElementById('sticky-group-wilaya'));
        updateOrderSummary();
    });

    // Commune change handlers
    mainCommuneSelect.addEventListener('change', () => {
        stickyCommuneSelect.value = mainCommuneSelect.value;
        clearValidation(document.getElementById('group-commune'));
        clearValidation(document.getElementById('sticky-group-commune'));
    });

    stickyCommuneSelect.addEventListener('change', () => {
        mainCommuneSelect.value = stickyCommuneSelect.value;
        clearValidation(document.getElementById('group-commune'));
        clearValidation(document.getElementById('sticky-group-commune'));
    });

    // Text inputs sync
    mainFullname.addEventListener('input', () => {
        syncInputs(mainFullname, stickyFullname);
        clearValidation(document.getElementById('group-fullname'));
        clearValidation(document.getElementById('sticky-group-fullname'));
    });
    stickyFullname.addEventListener('input', () => {
        syncInputs(stickyFullname, mainFullname);
        clearValidation(document.getElementById('group-fullname'));
        clearValidation(document.getElementById('sticky-group-fullname'));
    });

    mainPhone.addEventListener('input', () => {
        syncInputs(mainPhone, stickyPhone);
        clearValidation(document.getElementById('group-phone'));
        clearValidation(document.getElementById('sticky-group-phone'));
    });
    stickyPhone.addEventListener('input', () => {
        syncInputs(stickyPhone, mainPhone);
        clearValidation(document.getElementById('group-phone'));
        clearValidation(document.getElementById('sticky-group-phone'));
    });


    // --- 2. HERO CAROUSEL LOGIC ---
    const carousel = document.getElementById('carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('#indicators .indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carouselPhotos = document.querySelectorAll('.carousel-photo');

    let currentIndex = 0;
    const slideCount = slides.length;
    let autoplayInterval;

    // Mobile tap-to-zoom for carousel photos
    carouselPhotos.forEach(photo => {
        let isZoomed = false;
        
        photo.addEventListener('click', (e) => {
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                e.stopPropagation();
                isZoomed = !isZoomed;
                
                if (isZoomed) {
                    photo.style.transform = 'scale(2)';
                    photo.style.cursor = 'zoom-out';
                    photo.style.transition = 'transform 0.3s ease';
                } else {
                    photo.style.transform = 'scale(1)';
                    photo.style.cursor = 'pointer';
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (isZoomed && !photo.contains(e.target)) {
                isZoomed = false;
                photo.style.transform = 'scale(1)';
                photo.style.cursor = 'pointer';
            }
        });
    });

    // Center active slide class update based on scroll position
    function updateActiveSlide(index) {
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        currentIndex = index;
    }

    function scrollToSlide(index) {
        if (index < 0 || index >= slideCount) return;
        const targetScrollLeft = index * window.innerWidth;
        carousel.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
        });
        updateActiveSlide(index);
    }

    // Scroll listener to update dot indicators when user swipes on mobile
    let isScrolling;
    carousel.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            const index = Math.round(carousel.scrollLeft / window.innerWidth);
            if (index !== currentIndex && index >= 0 && index < slideCount) {
                updateActiveSlide(index);
            }
        }, 100);
    });

    // Control Buttons
    prevBtn.addEventListener('click', () => {
        resetAutoplay();
        let targetIndex = currentIndex - 1;
        if (targetIndex < 0) targetIndex = slideCount - 1;
        scrollToSlide(targetIndex);
    });

    nextBtn.addEventListener('click', () => {
        resetAutoplay();
        let targetIndex = currentIndex + 1;
        if (targetIndex >= slideCount) targetIndex = 0;
        scrollToSlide(targetIndex);
    });

    // Indicator Dot clicks
    indicators.forEach((indicator) => {
        indicator.addEventListener('click', (e) => {
            resetAutoplay();
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            scrollToSlide(index);
        });
    });

    // Autoplay function
    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= slideCount) nextIndex = 0;
            scrollToSlide(nextIndex);
        }, 6000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Initialize Autoplay
    startAutoplay();


    // --- 3. INTERACTIVE T-SHIRT FLIP CARD ---
    const shirtCard = document.getElementById('shirtFlipCard');
    const toggleFrontBtn = document.getElementById('toggleFrontBtn');
    const toggleBackBtn = document.getElementById('toggleBackBtn');
    const productFrontImg = document.querySelector('.product-front-img');
    const productBackImg = document.querySelector('.product-back-img');
    const productDtfImg = document.querySelector('.product-dtf-img');
    const toggleDtfBtn = document.getElementById('toggleDtfBtn');

    // Mobile tap-to-zoom functionality for product images
    function setupMobileZoom(imgElement) {
        if (!imgElement) return;
        
        let isZoomed = false;
        
        imgElement.addEventListener('click', (e) => {
            // Only enable zoom on mobile/touch devices
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                e.stopPropagation();
                isZoomed = !isZoomed;
                
                if (isZoomed) {
                    imgElement.style.transform = 'scale(2)';
                    imgElement.style.cursor = 'zoom-out';
                    imgElement.style.transition = 'transform 0.3s ease';
                } else {
                    imgElement.style.transform = 'scale(1)';
                    imgElement.style.cursor = 'pointer';
                }
            }
        });

        // Reset zoom when clicking outside
        document.addEventListener('click', (e) => {
            if (isZoomed && !imgElement.contains(e.target)) {
                isZoomed = false;
                imgElement.style.transform = 'scale(1)';
                imgElement.style.cursor = 'pointer';
            }
        });
    }

    // Setup zoom for all product images
    setupMobileZoom(productFrontImg);
    setupMobileZoom(productBackImg);
    setupMobileZoom(productDtfImg);

        function showFront() {
            shirtCard.classList.remove('flipped');
            toggleFrontBtn.classList.add('active');
            toggleBackBtn.classList.remove('active');
            toggleDtfBtn.classList.remove('active');
            // Hide DTF image if visible
            if (productDtfImg) productDtfImg.style.display = 'none';
        }

        function showBack() {
            shirtCard.classList.add('flipped');
            toggleFrontBtn.classList.remove('active');
            toggleBackBtn.classList.add('active');
            toggleDtfBtn.classList.remove('active');
            // Ensure back image is visible, hide DTF image
            productBackImg.style.display = 'block';
            if (productDtfImg) productDtfImg.style.display = 'none';
        }

    // Toggle by clicking the card itself
    shirtCard.addEventListener('click', () => {
        if (shirtCard.classList.contains('flipped')) {
            showFront();
        } else {
            showBack();
        }
    });

    // Toggle by clicking control buttons
    toggleFrontBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showFront();
    });

    toggleBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showBack();
    });



    function showDtf() {
        // Flip to back side to display DTF image
        shirtCard.classList.add('flipped');
        // Update active button states
        toggleFrontBtn.classList.remove('active');
        toggleBackBtn.classList.remove('active');
        toggleDtfBtn.classList.add('active');
        // Show DTF image, hide back image
        productBackImg.style.display = 'none';
        productDtfImg.style.display = 'block';
    }

    toggleDtfBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDtf();
    });


    // --- 4. FORM VALIDATION & CHECKOUT ---
    const successModal = document.getElementById('successModalBackdrop');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const buyerName = document.getElementById('buyerName');
    const buyerPhone = document.getElementById('buyerPhone');
    const buyerWilaya = document.getElementById('buyerWilaya');
    const buyerCommune = document.getElementById('buyerCommune');

    // Remove red borders
    function clearValidation(container) {
        if (container) {
            container.classList.remove('is-invalid');
        }
    }

    // Set error red borders
    function setInvalid(container) {
        if (container) {
            container.classList.add('is-invalid');
        }
    }

    function validateSizesAndDelivery() {
        let isValid = true;
        const totalQty = getTotalShirtQty();

        if (totalQty < 1) {
            setInvalid(document.getElementById('group-sizes'));
            isValid = false;
        } else {
            clearValidation(document.getElementById('group-sizes'));
        }

        const method = getSelectedDeliveryMethod();
        const rates = getDeliveryRates(getSelectedWilayaCode());
        if (method === 'stopdesk' && rates && rates.stopDesk == null) {
            setInvalid(document.getElementById('group-delivery'));
            isValid = false;
        } else {
            clearValidation(document.getElementById('group-delivery'));
        }

        return isValid;
    }

    // Validate a form submission
    function validateForm(nameVal, phoneVal, wilayaVal, communeVal, formType) {
        let isValid = true;
        const suffix = formType === 'sticky' ? 'sticky-group-' : 'group-';

        // 1. Name validate (minimum 3 characters)
        if (!nameVal || nameVal.trim().length < 3) {
            setInvalid(document.getElementById(`${suffix}fullname`));
            isValid = false;
        } else {
            clearValidation(document.getElementById(`${suffix}fullname`));
        }

        // 2. Phone validate (Algerian format check: 05, 06, 07 followed by 8 digits)
        // Accept spaces or hyphens e.g. 0555123456 or 05-55-12-34-56 or 0755 12 34 56
        const cleanPhone = phoneVal.replace(/[\s-]/g, '');
        const phoneRegex = /^(05|06|07)\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
            setInvalid(document.getElementById(`${suffix}phone`));
            isValid = false;
        } else {
            clearValidation(document.getElementById(`${suffix}phone`));
        }

        // 3. Wilaya validate
        if (!wilayaVal) {
            setInvalid(document.getElementById(`${suffix}wilaya`));
            isValid = false;
        } else {
            clearValidation(document.getElementById(`${suffix}wilaya`));
        }

        // 4. Commune validate
        if (!communeVal) {
            setInvalid(document.getElementById(`${suffix}commune`));
            isValid = false;
        } else {
            clearValidation(document.getElementById(`${suffix}commune`));
        }

        if (!validateSizesAndDelivery()) {
            isValid = false;
        }

        return isValid;
    }

    // Handle order placement and success modal popup
    async function handleOrderSubmit(e, formType) {
        e.preventDefault();
        
        let nameVal, phoneVal, wilayaCode, communeVal, form;

        if (formType === 'main') {
            nameVal = mainFullname.value;
            phoneVal = mainPhone.value;
            wilayaCode = mainWilayaSelect.value;
            communeVal = mainCommuneSelect.value;
            form = mainForm;
        } else {
            nameVal = stickyFullname.value;
            phoneVal = stickyPhone.value;
            wilayaCode = stickyWilayaSelect.value;
            communeVal = stickyCommuneSelect.value;
            form = stickyForm;
        }

        const isFormValid = validateForm(nameVal, phoneVal, wilayaCode, communeVal, formType);

        if (isFormValid) {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span data-i18n="sending">Envoi...</span>';

            // Collect form data
            const formData = new FormData(form);
            
            // Add order details
            const wilayaObj = ALGERIA_DATA.find(w => w.code === wilayaCode);
            const wilayaName = wilayaObj
                ? (getLang() === 'ar' ? wilayaObj.name_ar : wilayaObj.name)
                : wilayaCode;
            const totalQty = getTotalShirtQty();
            const method = getSelectedDeliveryMethod();
            const shirtPrice = getShirtBundlePrice(totalQty);
            const deliveryFee = getDeliveryFee(wilayaCode, method);
            const total = shirtPrice + deliveryFee;
            const breakdown = getSizeBreakdown();
            const deliveryLabel = method === 'stopdesk'
                ? t('deliveryStopDeskShort')
                : t('deliveryHomeShort');

            // Set form data for Web3Forms
            formData.set('fullname', nameVal);
            formData.set('phone', phoneVal);
            formData.set('wilaya', wilayaName);
            formData.set('commune', communeVal);
            formData.set('delivery_method', deliveryLabel);
            
            const sizeLines = breakdown.map(s => `${s.qty}x ${s.label}`).join(', ');
            formData.append('quantite_tailles', sizeLines);
            formData.append('delivery_fee', deliveryFee);
            formData.append('total', total);

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    buyerName.textContent = nameVal;
                    buyerPhone.textContent = phoneVal;
                    buyerWilaya.textContent = wilayaName;

                    const communeObj = wilayaObj?.communes?.find(c => c.name === communeVal);
                    buyerCommune.textContent = communeObj
                        ? getCommuneLabel(communeObj)
                        : communeVal;

                    const sizeLinesLocalized = breakdown
                        .map(s => t('sizeLine', { qty: s.qty, size: s.label }))
                        .join(', ');
                    successOrderDetails.innerHTML = `
                        <p><strong>${t('successSizes')} :</strong> ${sizeLinesLocalized}</p>
                        <p><strong>${t('successDelivery')} :</strong> ${deliveryLabel} — ${formatPrice(deliveryFee)}</p>
                        <p><strong>${t('successTotal')} :</strong> ${formatPrice(total)}</p>
                    `;

                    successModal.classList.add('active');

                    mainForm.reset();
                    stickyForm.reset();
                    document.querySelector('#group-delivery input[value="home"]').checked = true;
                    sizeInputs.forEach(input => { input.value = 0; });
                    mainCommuneSelect.disabled = true;
                    stickyCommuneSelect.disabled = true;
                    updateOrderSummary();
                } else {
                    alert('Erreur lors de l\'envoi du formulaire. Veuillez réessayer.');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Erreur de connexion. Veuillez vérifier votre internet et réessayer.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = formType === 'main' 
                    ? '<i class="fa-solid fa-circle-check"></i> <span data-i18n="confirmOrder">Confirmer ma Commande</span>'
                    : '<i class="fa-solid fa-cart-shopping"></i> <span data-i18n="buy">Acheter</span>';
            }
        }
    }

    mainForm.addEventListener('submit', (e) => handleOrderSubmit(e, 'main'));
    stickyForm.addEventListener('submit', (e) => handleOrderSubmit(e, 'sticky'));

    // Close Modal Popup handler
    closeModalBtn.addEventListener('click', () => {
        successModal.classList.remove('active');
    });

    // Close Modal Popup if user clicks background
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('active');
        }
    });


    // --- 5. STICKY BOTTOM BAR VISIBILITY ANIMATION ---
    const stickyBar = document.getElementById('stickyBar');
    const heroSection = document.getElementById('hero');

    // Throttle function for scroll events
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Sticky bar only appears once the user has scrolled past the hero section
    const handleScroll = () => {
        const heroHeight = heroSection.offsetHeight;
        if (window.scrollY > heroHeight - 100) {
            stickyBar.style.transform = 'translateY(0)';
        } else {
            // Keep it hidden below viewport
            stickyBar.style.transform = 'translateY(100%)';
        }
    };

    // Use throttled scroll event for better performance
    window.addEventListener('scroll', throttle(handleScroll, 100));

    // Set initial position of sticky bar as hidden
    stickyBar.style.transform = 'translateY(100%)';

    updateOrderSummary();
});
