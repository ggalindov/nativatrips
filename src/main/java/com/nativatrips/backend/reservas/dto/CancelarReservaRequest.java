package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.Size;

public record CancelarReservaRequest(@Size(max = 500) String motivo) {
}
