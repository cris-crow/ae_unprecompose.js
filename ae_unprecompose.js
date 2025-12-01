/*
Un-Precompose Script for After Effects
Versione: 1.0
Descrizione: Estrae tutti i layer da una precomposizione selezionata nella comp principale
*/

(function unPrecompose() {
    app.beginUndoGroup("Un-Precompose");
    
    try {
        var comp = app.project.activeItem;
        
        // Verifica che ci sia una composizione attiva
        if (!comp || !(comp instanceof CompItem)) {
            alert("Errore: Nessuna composizione attiva. Apri una composizione prima di eseguire lo script.");
            return;
        }
        
        var selectedLayers = comp.selectedLayers;
        
        // Verifica che ci siano layer selezionati
        if (selectedLayers.length === 0) {
            alert("Errore: Seleziona almeno una precomposizione da un-precompose.");
            return;
        }
        
        var unPrecomposedCount = 0;
        
        // Processa ogni layer selezionato
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            
            // Verifica che il layer sia una precomp (AVLayer con source che è una CompItem)
            if (!(layer instanceof AVLayer) || !(layer.source instanceof CompItem)) {
                alert("Avviso: Il layer '" + layer.name + "' non è una precomposizione. Verrà saltato.");
                continue;
            }
            
            var precomp = layer.source;
            var parentComp = layer.containingComp;
            
            // Salva le proprietà del layer precomp
            var precompLayerIndex = layer.index;
            var precompStartTime = layer.startTime;
            var precompInPoint = layer.inPoint;
            var precompOutPoint = layer.outPoint;
            var precompPosition = layer.transform.position.value;
            var precompScale = layer.transform.scale.value;
            var precompRotation = layer.transform.rotation.value;
            var precompOpacity = layer.transform.opacity.value;
            var precompAnchor = layer.transform.anchorPoint.value;
            var precompParent = layer.parent;
            
            // Copia tutti i layer dalla precomp alla comp principale
            var layerData = [];
            
            // Prima raccogliamo tutti i dati dei layer
            for (var j = 1; j <= precomp.numLayers; j++) {
                var sourceLayer = precomp.layer(j);
                
                // Duplica il layer nella comp principale
                sourceLayer.copyToComp(parentComp);
                var newLayer = parentComp.layer(1); // Il nuovo layer sarà sempre in cima
                
                // Aggiusta il timing
                var adjustedStartTime = sourceLayer.startTime + precompInPoint;
                newLayer.startTime = adjustedStartTime;
                
                // Salva i dati del layer con il suo startTime per ordinamento successivo
                layerData.push({
                    layer: newLayer,
                    startTime: adjustedStartTime,
                    originalIndex: j
                });
                
                // Aggiusta la posizione considerando l'anchor point e la trasformazione della precomp
                if (newLayer.transform.position.dimensionsSeparated) {
                    // Posizione separata (X e Y separate)
                    var newPosX = newLayer.transform.xPosition.value + precompPosition[0] - precompAnchor[0];
                    var newPosY = newLayer.transform.yPosition.value + precompPosition[1] - precompAnchor[1];
                    newLayer.transform.xPosition.setValue(newPosX);
                    newLayer.transform.yPosition.setValue(newPosY);
                } else {
                    // Posizione normale
                    var newPos = [
                        newLayer.transform.position.value[0] + precompPosition[0] - precompAnchor[0],
                        newLayer.transform.position.value[1] + precompPosition[1] - precompAnchor[1]
                    ];
                    if (newLayer.transform.position.value.length === 3) {
                        newPos.push(newLayer.transform.position.value[2] + precompPosition[2] - precompAnchor[2]);
                    }
                    newLayer.transform.position.setValue(newPos);
                }
                
                // Applica scala dalla precomp
                var newScale = [
                    (newLayer.transform.scale.value[0] * precompScale[0]) / 100,
                    (newLayer.transform.scale.value[1] * precompScale[1]) / 100,
                    (newLayer.transform.scale.value[2] * precompScale[2]) / 100
                ];
                newLayer.transform.scale.setValue(newScale);
                
                // Applica rotazione dalla precomp
                newLayer.transform.rotation.setValue(newLayer.transform.rotation.value + precompRotation);
                
                // Applica opacità dalla precomp
                var newOpacity = (newLayer.transform.opacity.value * precompOpacity) / 100;
                newLayer.transform.opacity.setValue(newOpacity);
                
                // Imposta il parent se la precomp ne aveva uno
                if (precompParent) {
                    newLayer.parent = precompParent;
                }
            }
            
            // Rimuovi il layer precomp originale
            layer.remove();
            
            // Ordina i layer per startTime (dal più vecchio al più recente)
            layerData.sort(function(a, b) {
                return a.startTime - b.startTime;
            });
            
            // Riordina i layer nella timeline in base al loro startTime
            // Il layer con startTime minore deve essere più in alto (index più basso)
            for (var k = 0; k < layerData.length; k++) {
                layerData[k].layer.moveToBeginning();
            }
            
            // Ora inverti l'ordine per avere il primo in alto
            for (var k = layerData.length - 1; k >= 0; k--) {
                layerData[k].layer.moveToBeginning();
            }
            
            unPrecomposedCount++;
        }
        
        if (unPrecomposedCount > 0) {
            alert("Completato! " + unPrecomposedCount + " precomposizione(i) estratte con successo.");
        }
        
    } catch (error) {
        alert("Errore durante l'un-precompose:\n" + error.toString());
    } finally {
        app.endUndoGroup();
    }
})();