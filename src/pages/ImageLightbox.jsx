import React, { useState, useEffect } from 'react';
import '../styles/ProjectModal.css';

const ImageLightbox = ({ image, images = [], onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        const initialIndex = images.findIndex(img => img.url === image || img === image);
        setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
    }, [image, images]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsZoomed(false);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setIsZoomed(false);
    };

    const currentImage = images[currentIndex];
    const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage?.url;

    return (
        <div className="lightbox-backdrop" onClick={onClose}>
            <button className="lightbox-close" onClick={onClose}>
                <i className="fa-solid fa-times"></i>
            </button>

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img
                    src={imageUrl}
                    alt="Lightbox"
                    className={`lightbox-image ${isZoomed ? 'zoomed' : ''}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                />

                {images.length > 1 && (
                    <>
                        <button className="lightbox-nav lightbox-nav-prev" onClick={prevImage}>
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <button className="lightbox-nav lightbox-nav-next" onClick={nextImage}>
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                        <div className="lightbox-counter">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}

                <div className="lightbox-controls">
                    <button onClick={() => setIsZoomed(!isZoomed)} className="control-btn">
                        <i className={`fa-solid fa-${isZoomed ? 'search-minus' : 'search-plus'}`}></i>
                    </button>
                    <a href={imageUrl} download className="control-btn">
                        <i className="fa-solid fa-download"></i>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ImageLightbox;