package de.fhg.iais.roberta.syntax.check.program;

import java.util.ArrayList;

import de.fhg.iais.roberta.components.NxtConfiguration;
import de.fhg.iais.roberta.syntax.Phrase;
import de.fhg.iais.roberta.syntax.action.nxt.LightSensorAction;
import de.fhg.iais.roberta.syntax.action.sound.ToneAction;
import de.fhg.iais.roberta.syntax.action.sound.VolumeAction;
import de.fhg.iais.roberta.syntax.sensor.generic.TemperatureSensor;
import de.fhg.iais.roberta.visitor.AstVisitor;
import de.fhg.iais.roberta.visitor.NxtAstVisitor;

/**
 * This class is implementing {@link AstVisitor}. All methods are implemented and they
 * append a human-readable JAVA code representation of a phrase to a StringBuilder. <b>This representation is correct JAVA code.</b> <br>
 */
public class NxtCodePreprocessVisitor extends PreprocessProgramVisitor implements NxtAstVisitor<Void> {

    private boolean isToneUsed = false;

    public NxtCodePreprocessVisitor(ArrayList<ArrayList<Phrase<Void>>> phrasesSet, NxtConfiguration configuration) {
        super(configuration);
        check(phrasesSet);
    }

    public boolean isToneUsed() {
        return this.isToneUsed;
    }

    @Override
    public Void visitLightSensorAction(LightSensorAction<Void> lightSensorAction) {
        return null;
    }

    @Override
    public Void visitVolumeAction(VolumeAction<Void> volumeAction) {
        this.isToneUsed = true;
        return null;
    }

    @Override
    public Void visitToneAction(ToneAction<Void> toneAction) {
        this.isToneUsed = true;
        return null;
    }

    @Override
    public Void visitTemperatureSensor(TemperatureSensor<Void> temperatureSensor) {
        // TODO Auto-generated method stub
        return null;
    }

}